import { toWei, fromWei } from 'web3-utils';
import { callFunction, NetworkProvider, sendTransaction, ERROR_MAX_FEE_PER_GAS } from '@/util/network';
import { WithdrawalState, WithdrawalType } from '@/enums';
import { AssetPoolType } from '@/models/AssetPool';
import { Withdrawal } from '@/models/Withdrawal';
import { IAccount } from '@/models/Account';
import { Artifacts } from '@/util/artifacts';
import { parseLogs, findEvent } from '@/util/events';
import { paginatedResults } from '@/util/pagination';

const ERROR_NO_WITHDRAWAL = 'Could not find an withdrawal for this beneficiary';

interface IWithdrawalUpdates {
    withdrawalId: number;
    memberId: number;
    rewardId?: number;
}

export default class WithdrawalService {
    static async get(assetPool: AssetPoolType, withdrawalId: number) {
        try {
            const withdrawal = await Withdrawal.findOne({
                poolAddress: assetPool.address,
                withdrawalId,
            });
            return { withdrawal };
        } catch (error) {
            return { error };
        }
    }

    static async getById(id: string) {
        try {
            const withdrawal = await Withdrawal.findById(id);

            return { withdrawal };
        } catch (error) {
            return { error };
        }
    }

    static async getAllScheduled() {
        return await Withdrawal.find({
            $or: [{ failReason: ERROR_MAX_FEE_PER_GAS }, { failReason: { $exists: false } }, { failReason: '' }],
            withdrawalId: { $exists: false },
            state: WithdrawalState.Pending,
        }).sort({ createdAt: -1 });
    }

    static async schedule(
        assetPool: AssetPoolType,
        type: WithdrawalType,
        beneficiary: string,
        amount: number,
        state = WithdrawalState.Pending,
        rewardId?: number,
    ) {
        const withdrawal = new Withdrawal({
            type,
            amount,
            rewardId,
            beneficiary,
            poolAddress: assetPool.solution.options.address,
            state,
        });

        return await withdrawal.save();
    }

    static async getPendingBalance(account: IAccount, poolAddress: string) {
        try {
            const withdrawals = await Withdrawal.find({
                poolAddress,
                beneficiary: account.address,
                state: 0,
            });
            const pending = withdrawals.map((item) => item.amount).reduce((prev, curr) => prev + curr, 0);

            return { pending };
        } catch (error) {
            return { error };
        }
    }

    // Invoked from job
    static async proposeWithdraw(assetPool: AssetPoolType, id: string, beneficiary: string, amount: number) {
        const amountInWei = toWei(amount.toString());
        const tx = await sendTransaction(
            assetPool.address,
            assetPool.solution.methods.proposeWithdraw(amountInWei, beneficiary),
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
        const { withdrawal } = await this.getById(id);

        if (memberId) {
            withdrawal.beneficiary = await callFunction(
                assetPool.solution.methods.getAddressByMember(memberId),
                assetPool.network,
            );
        }

        if (withdrawalId) {
            withdrawal.withdrawalId = withdrawalId; // TODO make migration for this
            withdrawal.amount = Number(
                fromWei(await callFunction(assetPool.solution.methods.getAmount(withdrawalId), assetPool.network)),
            );
            withdrawal.approved = await callFunction(
                assetPool.solution.methods.withdrawPollApprovalState(withdrawalId),
                assetPool.network,
            );
            const poll = {
                startTime: Number(
                    await callFunction(assetPool.solution.methods.getStartTime(withdrawalId), assetPool.network),
                ),
                endTime: Number(
                    await callFunction(assetPool.solution.methods.getEndTime(withdrawalId), assetPool.network),
                ),
                yesCounter: 0,
                noCounter: 0,
                totalVoted: 0,
            };
            withdrawal.poll = poll;
        }

        return await withdrawal.save();
    }

    static async withdrawPollFinalize(assetPool: AssetPoolType, id: string) {
        try {
            const withdrawal = await Withdrawal.findById(id);

            if (withdrawal.state === WithdrawalState.Deferred) {
                throw new Error('Not able to withdraw funds for custodial wallets.');
            }

            const tx = await sendTransaction(
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

            return {
                finalizedWithdrawal: await withdrawal.save(),
            };
        } catch (error) {
            return { error };
        }
    }

    static async getAll(
        poolAddress: string,
        page: number,
        limit: number,
        beneficiary?: string,
        rewardId?: number,
        state?: number,
    ) {
        try {
            const query = {
                ...(poolAddress ? { poolAddress } : {}),
                ...(beneficiary ? { beneficiary } : {}),
                ...(rewardId || rewardId === 0 ? { rewardId } : {}),
                ...(state === 0 || state === 1 ? { state } : {}),
            };
            const result = await paginatedResults(Withdrawal, page, limit, query);

            return { result };
        } catch (error) {
            return { error };
        }
    }

    static async removeAllForAddress(address: string) {
        try {
            const withdrawals = await Withdrawal.find({ poolAddress: address });

            for (const w of withdrawals) {
                await w.remove();
            }
            return { result: true };
        } catch (error) {
            return { error };
        }
    }

    static async hasClaimedOnce(poolAddress: string, beneficiary: string, rewardId: number) {
        try {
            const withdrawal = await Withdrawal.findOne({
                beneficiary,
                rewardId,
                poolAddress,
                state: WithdrawalState.Withdrawn,
            });

            return { withdrawal };
        } catch (error) {
            return { error };
        }
    }

    static async getByBeneficiary(beneficiary: string) {
        try {
            const withdrawals = await Withdrawal.find({ beneficiary });

            if (!withdrawals) {
                throw new Error(ERROR_NO_WITHDRAWAL);
            }

            return { withdrawals };
        } catch (error) {
            return { error };
        }
    }

    static async countByNetwork(network: NetworkProvider) {
        try {
            return await Withdrawal.countDocuments({ network });
        } catch (error) {
            return { error };
        }
    }
}
