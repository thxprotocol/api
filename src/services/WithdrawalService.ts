import { toWei } from 'web3-utils';
import { ChainId } from '@/types/enums';
import { WithdrawalState, WithdrawalType } from '@/types/enums';
import { AssetPoolDocument } from '@/models/AssetPool';
import { Withdrawal, WithdrawalDocument } from '@/models/Withdrawal';
import { IAccount } from '@/models/Account';
import { assertEvent, findEvent, CustomEventLog } from '@/util/events';
import { paginatedResults } from '@/util/pagination';
import { TransactionDocument } from '@/models/Transaction';
import TransactionService from './TransactionService';
import AccountProxy from '@/proxies/AccountProxy';
import MemberService from './MemberService';

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

    static getAllScheduled(poolId: string) {
        return Withdrawal.find({
            $or: [{ failReason: { $exists: false } }, { failReason: '' }],
            transactionHash: { $exists: false },
            state: WithdrawalState.Pending,
            poolId,
        });
    }

    static getByPoolAndRewardID(poolId: string, rewardId: number) {
        return Withdrawal.find({
            poolId,
            rewardId,
        });
    }

    static schedule(
        assetPool: AssetPoolDocument,
        type: WithdrawalType,
        sub: string,
        amount: number,
        state = WithdrawalState.Pending,
        unlockDate?: Date,
        rewardId?: number,
    ) {
        return Withdrawal.create({
            type,
            sub,
            poolId: String(assetPool._id),
            amount,
            state,
            rewardId,
            unlockDate,
        });
    }

    static async getPendingBalance(account: IAccount, poolId: string) {
        const withdrawals = await Withdrawal.find({
            poolId,
            sub: account.id,
            state: WithdrawalState.Pending,
        });
        return withdrawals.map((item) => item.amount).reduce((prev, curr) => prev + curr, 0);
    }

    static async proposeWithdraw(assetPool: AssetPoolDocument, withdrawal: WithdrawalDocument, account: IAccount) {
        const amountInWei = toWei(String(withdrawal.amount));
        const unlockDateTmestamp = Math.floor(
            (withdrawal.unlockDate ? withdrawal.unlockDate.getTime() : Date.now()) / 1000,
        );
        const callback = async (tx: TransactionDocument, events?: CustomEventLog[]) => {
            if (events) {
                const roleGranted = findEvent('RoleGranted', events);
                const event = findEvent('WithdrawPollCreated', events);

                if (roleGranted) {
                    await MemberService.addExistingMember(assetPool, roleGranted.args.account);
                }

                withdrawal.withdrawalId = event.args.id;
            }

            withdrawal.transactions.push(String(tx._id));

            return await withdrawal.save();
        };

        return await TransactionService.relay(
            assetPool.contract,
            'proposeWithdraw',
            [amountInWei, account.address, unlockDateTmestamp],
            assetPool.chainId,
            callback,
        );
    }

    static async withdraw(assetPool: AssetPoolDocument, withdrawal: WithdrawalDocument) {
        const callback = async (tx: TransactionDocument, events?: CustomEventLog[]) => {
            if (events) {
                assertEvent('WithdrawPollFinalized', events);
                assertEvent('Withdrawn', events);
                withdrawal.state = WithdrawalState.Withdrawn;
            }
            withdrawal.transactions.push(String(tx._id));
            return await withdrawal.save();
        };

        return await TransactionService.relay(
            assetPool.contract,
            'withdrawPollFinalize',
            [withdrawal.withdrawalId],
            assetPool.chainId,
            callback,
        );
    }

    static countByPool(assetPool: AssetPoolDocument) {
        return Withdrawal.find({ poolId: String(assetPool._id) }).count();
    }

    static findByQuery(query: { poolId: string; rewardId: number }) {
        return Withdrawal.find(query);
    }

    static async getAll(
        poolId: string,
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
            ...(poolId ? { poolId } : {}),
            ...(account ? { sub: account.id } : {}),
            ...(rewardId || rewardId === 0 ? { rewardId } : {}),
            ...(state === 0 || state === 1 ? { state } : {}),
        };
        return await paginatedResults(Withdrawal, page, limit, query);
    }

    static async removeAllForPool(pool: AssetPoolDocument) {
        const withdrawals = await Withdrawal.find({ poolId: String(pool._id) });

        for (const w of withdrawals) {
            await w.remove();
        }
    }

    static async hasClaimedOnce(poolId: string, sub: string, rewardId: number) {
        const withdrawal = await Withdrawal.findOne({
            sub,
            rewardId,
            poolId,
        });

        return !!withdrawal;
    }

    static getByBeneficiary(beneficiary: string) {
        return Withdrawal.find({ beneficiary });
    }

    static countByNetwork(chainId: ChainId) {
        return Withdrawal.countDocuments({ chainId });
    }
}
