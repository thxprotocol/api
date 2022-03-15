import { toWei } from 'web3-utils';
import { NetworkProvider } from '@/types/enums';
import { WithdrawalState, WithdrawalType } from '@/types/enums';
import { AssetPoolType } from '@/models/AssetPool';
import { Withdrawal, WithdrawalDocument } from '@/models/Withdrawal';
import { IAccount } from '@/models/Account';
import { parseLogs, assertEvent, findEvent } from '@/util/events';
import { paginatedResults } from '@/util/pagination';
import TransactionService from './TransactionService';
import { NETWORK_ENVIRONMENT } from '@/config/secrets';
import InfuraService from './InfuraService';
import AccountProxy from '@/proxies/AccountProxy';
import MemberService from './MemberService';
import { diamondAbi } from '@/config/contracts';

export default class WithdrawalService {
    static getById(id: string) {
        return Withdrawal.findById(id);
    }

    static countScheduled() {
        return Withdrawal.find({
            $or: [{ failReason: { $exists: false } }, { failReason: '' }],
            transactionHash: { $exists: false },
            state: WithdrawalState.Pending,
        });
    }

    static getAllScheduled(poolAddress: string) {
        return Withdrawal.find({
            $or: [{ failReason: { $exists: false } }, { failReason: '' }],
            transactionHash: { $exists: false },
            state: WithdrawalState.Pending,
            poolAddress,
        });
    }

    static schedule(
        assetPool: AssetPoolType,
        type: WithdrawalType,
        sub: string,
        amount: number,
        state = WithdrawalState.Pending,
        rewardId?: number,
    ) {
        return Withdrawal.create({
            type,
            sub,
            amount,
            poolAddress: assetPool.address,
            state,
            rewardId,
            transactions: [],
        });
    }

    static async getPendingBalance(account: IAccount, poolAddress: string) {
        const withdrawals = await Withdrawal.find({
            poolAddress,
            sub: account.id,
            state: WithdrawalState.Pending,
        });
        return withdrawals.map((item) => item.amount).reduce((prev, curr) => prev + curr, 0);
    }

    static async proposeWithdraw(assetPool: AssetPoolType, withdrawal: WithdrawalDocument, account: IAccount) {
        const amountInWei = toWei(String(withdrawal.amount));

        if (NETWORK_ENVIRONMENT === 'dev' || NETWORK_ENVIRONMENT === 'prod') {
            const tx = await InfuraService.send(
                assetPool.address,
                'proposeWithdraw',
                [amountInWei, account.address],
                assetPool.network,
            );
            withdrawal.transactions.push(String(tx._id));
            return await withdrawal.save();
        } else {
            try {
                const { tx, receipt } = await TransactionService.send(
                    assetPool.address,
                    assetPool.solution.methods.proposeWithdraw(amountInWei, account.address),
                    assetPool.network,
                );
                const events = parseLogs(diamondAbi(assetPool.network, 'defaultPool'), receipt.logs);
                const event = assertEvent('WithdrawPollCreated', events);
                const roleGranted = findEvent('RoleGranted', events);

                if (roleGranted) {
                    await MemberService.addExistingMember(assetPool, roleGranted.args.account);
                }

                withdrawal.withdrawalId = event.args.id;
                withdrawal.transactions.push(String(tx._id));

                return await withdrawal.save();
            } catch (error) {
                withdrawal.updateOne({ failReason: error.message });
                throw error;
            }
        }
    }

    static async withdraw(assetPool: AssetPoolType, withdrawal: WithdrawalDocument) {
        if (NETWORK_ENVIRONMENT === 'dev' || NETWORK_ENVIRONMENT === 'prod') {
            const tx = await InfuraService.send(
                assetPool.address,
                'withdrawPollFinalize',
                [withdrawal.withdrawalId],
                assetPool.network,
            );

            withdrawal.transactions.push(String(tx._id));

            return await withdrawal.save();
        } else {
            try {
                const { tx, receipt } = await TransactionService.send(
                    assetPool.address,
                    assetPool.solution.methods.withdrawPollFinalize(withdrawal.withdrawalId),
                    assetPool.network,
                );

                const events = parseLogs(assetPool.solution.options.jsonInterface, receipt.logs);

                assertEvent('WithdrawPollFinalized', events);
                assertEvent('Withdrawn', events);

                withdrawal.transactions.push(String(tx._id));
                withdrawal.state = WithdrawalState.Withdrawn;

                return await withdrawal.save();
            } catch (error) {
                withdrawal.failReason = error.message;
                throw error;
            }
        }
    }

    static async countByPoolAddress(assetPool: AssetPoolType) {
        return (await Withdrawal.find({ poolAddress: assetPool.address })).length;
    }

    static async getAll(
        poolAddress: string,
        page: number,
        limit: number,
        beneficiary?: string,
        rewardId?: number,
        state?: number,
    ) {
        let account;
        if (beneficiary) {
            account = await AccountProxy.getByAddress(beneficiary);
        }
        const query = {
            ...(poolAddress ? { poolAddress } : {}),
            ...(account ? { sub: account.id } : {}),
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

    static async hasClaimedOnce(poolAddress: string, sub: string, rewardId: number) {
        const withdrawal = await Withdrawal.findOne({
            sub,
            rewardId,
            poolAddress,
        });

        return !!withdrawal;
    }

    static getByBeneficiary(beneficiary: string) {
        return Withdrawal.find({ beneficiary });
    }

    static countByNetwork(network: NetworkProvider) {
        return Withdrawal.countDocuments({ network });
    }
}
