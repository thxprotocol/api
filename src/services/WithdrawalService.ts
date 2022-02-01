import { IAssetPool } from '../models/AssetPool';
import { callFunction, ERROR_GAS_PRICE_EXCEEDS_CAP, NetworkProvider, sendTransaction } from '../util/network';
import { Artifacts } from '../util/artifacts';
import { parseLogs, findEvent } from '../util/events';
import { Withdrawal, WithdrawalState, WithdrawalType } from '../models/Withdrawal';
import { toWei, fromWei } from 'web3-utils';
import { paginatedResults } from '../util/pagination';
import { IAccount } from '../models/Account';

const ERROR_NO_WITHDRAWAL = 'Could not find an withdrawal for this beneficiary';

interface IWithdrawalUpdates {
    withdrawalId: number;
    memberId: number;
    rewardId?: number;
}

export default class WithdrawalService {
    static async get(assetPool: IAssetPool, withdrawalId: number) {
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
            $or: [{ failReason: ERROR_GAS_PRICE_EXCEEDS_CAP }, { failReason: { $exists: false } }, { failReason: '' }],
            withdrawalId: { $exists: false },
        }).sort({ createdAt: -1 });
    }

    static async schedule(
        assetPool: IAssetPool,
        type: WithdrawalType,
        beneficiary: string,
        amount: number,
        rewardId?: number,
    ) {
        const withdrawal = new Withdrawal({
            type,
            amount,
            rewardId,
            beneficiary,
            poolAddress: assetPool.solution.options.address,
            state: WithdrawalState.Pending,
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
    static async proposeWithdraw(assetPool: IAssetPool, id: string, beneficiary: string, amount: number) {
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
    static async update(assetPool: IAssetPool, id: string, { withdrawalId, memberId }: IWithdrawalUpdates) {
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

    static async withdrawPollFinalize(assetPool: IAssetPool, id: string) {
        try {
            const withdrawal = await Withdrawal.findById(id);
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
