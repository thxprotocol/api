import { toWei, fromWei } from 'web3-utils';
import { MaxFeePerGasExceededError } from '@/util/network';
import { NetworkProvider } from '@/types/enums';
import { WithdrawalState, WithdrawalType } from '@/types/enums';
import { AssetPoolType } from '@/models/AssetPool';
import { Withdrawal, WithdrawalDocument } from '@/models/Withdrawal';
import { IAccount } from '@/models/Account';
import { Artifacts } from '@/util/artifacts';
import { parseLogs, findEvent } from '@/util/events';
import { paginatedResults } from '@/util/pagination';
import { THXError } from '@/util/errors';
import { TransactionService } from './TransactionService';
import AccountProxy from '@/proxies/AccountProxy';

class CannotWithdrawForCustodialError extends THXError {
    message = 'Not able to withdraw funds for custodial wallets.';
}

interface IWithdrawalUpdates {
    withdrawalId: number;
    memberId: number;
    rewardId?: number;
}

export default class WithdrawalService {
    static getById(id: string) {
        return Withdrawal.findById(id);
    }

    static async countScheduled() {
        return await Withdrawal.find({
            $or: [
                { failReason: new MaxFeePerGasExceededError().message },
                { failReason: { $exists: false } },
                { failReason: '' },
            ],
            withdrawalId: { $exists: false },
            state: WithdrawalState.Pending,
        }).sort({ createdAt: -1 });
    }

    static async getAllScheduled(poolAddress: string) {
        return await Withdrawal.find({
            $or: [
                { failReason: new MaxFeePerGasExceededError().message },
                { failReason: { $exists: false } },
                { failReason: '' },
            ],
            withdrawalId: { $exists: false },
            state: WithdrawalState.Pending,
            poolAddress,
        }).sort({ createdAt: -1 });
    }

    static async schedule(
        assetPool: AssetPoolType,
        type: WithdrawalType,
        sub: string,
        amount: number,
        state = WithdrawalState.Pending,
        rewardId?: number,
    ) {
        const withdrawal = new Withdrawal({
            type,
            sub,
            amount,
            rewardId,
            poolAddress: assetPool.address,
            state,
        });

        return await withdrawal.save();
    }

    static async getPendingBalance(account: IAccount, poolAddress: string) {
        const withdrawals = await Withdrawal.find({
            poolAddress,
            beneficiary: account.address,
            state: 0,
        });
        return withdrawals.map((item) => item.amount).reduce((prev, curr) => prev + curr, 0);
    }

    // Invoked from job
    static async proposeWithdraw(assetPool: AssetPoolType, id: string, sub: string, amount: number) {
        const account = await AccountProxy.getById(sub);
        const amountInWei = toWei(amount.toString());
        const tx = await TransactionService.send(
            assetPool.address,
            assetPool.solution.methods.proposeWithdraw(amountInWei, account.address),
            assetPool.network,
        );
        const events = parseLogs(Artifacts.IDefaultDiamond.abi, tx.logs);
        const event = findEvent('WithdrawPollCreated', events);

        return await this.update(assetPool, id, {
            withdrawalId: event.args.id,
            memberId: event.args.member,
        });
    }

    // Invoked from job
    static async update(assetPool: AssetPoolType, id: string, { withdrawalId, memberId }: IWithdrawalUpdates) {
        const withdrawal = await this.getById(id);

        if (memberId) {
            withdrawal.beneficiary = await TransactionService.call(
                assetPool.solution.methods.getAddressByMember(memberId),
                assetPool.network,
            );
        }

        if (withdrawalId) {
            withdrawal.withdrawalId = withdrawalId; // TODO make migration for this
            withdrawal.amount = Number(
                fromWei(
                    await TransactionService.call(
                        assetPool.solution.methods.getAmount(withdrawalId),
                        assetPool.network,
                    ),
                ),
            );
            withdrawal.approved = await TransactionService.call(
                assetPool.solution.methods.withdrawPollApprovalState(withdrawalId),
                assetPool.network,
            );
            const poll = {
                startTime: Number(
                    await TransactionService.call(
                        assetPool.solution.methods.getStartTime(withdrawalId),
                        assetPool.network,
                    ),
                ),
                endTime: Number(
                    await TransactionService.call(
                        assetPool.solution.methods.getEndTime(withdrawalId),
                        assetPool.network,
                    ),
                ),
                yesCounter: 0,
                noCounter: 0,
                totalVoted: 0,
            };
            withdrawal.poll = poll;
        }

        return await withdrawal.save();
    }

    static async withdrawPollFinalize(assetPool: AssetPoolType, withdrawal: WithdrawalDocument) {
        if (withdrawal.state === WithdrawalState.Deferred) {
            throw new CannotWithdrawForCustodialError();
        }

        const tx = await TransactionService.send(
            assetPool.solution.options.address,
            assetPool.solution.methods.withdrawPollFinalize(withdrawal.withdrawalId),
            assetPool.network,
        );

        const events = parseLogs(Artifacts.IDefaultDiamond.abi, tx.logs);
        const eventWithdrawPollFinalized = findEvent('WithdrawPollFinalized', events);
        const eventWithdrawn = findEvent('Withdrawn', events);

        if (eventWithdrawPollFinalized) {
            withdrawal.poll = null;
        }

        if (eventWithdrawn) {
            withdrawal.state = WithdrawalState.Withdrawn;
        }

        return await withdrawal.save();
    }

    static async getAll(
        poolAddress: string,
        page: number,
        limit: number,
        beneficiary?: string,
        rewardId?: number,
        state?: number,
    ) {
        const query = {
            ...(poolAddress ? { poolAddress } : {}),
            ...(beneficiary ? { beneficiary } : {}),
            ...(rewardId || rewardId === 0 ? { rewardId } : {}),
            ...(state === 0 || state === 1 ? { state } : {}),
        };
        return await paginatedResults(Withdrawal, page, limit, query);
    }

    static async removeAllForAddress(address: string) {
        const withdrawals = await Withdrawal.find({ poolAddress: address });

        for (const w of withdrawals) {
            await w.remove();
        }
    }

    static async hasClaimedOnce(poolAddress: string, beneficiary: string, rewardId: number) {
        const withdrawal = await Withdrawal.findOne({
            beneficiary,
            rewardId,
            poolAddress,
            state: WithdrawalState.Withdrawn,
        });

        return withdrawal;
    }

    static async getByBeneficiary(beneficiary: string) {
        return Withdrawal.find({ beneficiary });
    }

    static countByNetwork(network: NetworkProvider) {
        return Withdrawal.countDocuments({ network });
    }
}
