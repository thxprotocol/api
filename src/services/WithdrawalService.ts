import { IAssetPool } from '../models/AssetPool';
import { callFunction, sendTransaction } from '../util/network';
import { Artifacts } from '../util/artifacts';
import { parseLogs, findEvent } from '../util/events';
import { Withdrawal, WithdrawalState } from '../models/Withdrawal';
import { toWei, fromWei } from 'web3-utils';
import { paginatedResults } from '../util/pagination';

const ERROR_NO_WITHDRAWAL = 'Could not find an withdrawal for this beneficiary';

export default class WithdrawalService {
    static async get(poolAddress: string, withdrawalId: number) {
        try {
            const withdrawal = await Withdrawal.findOne({
                poolAddress,
                id: withdrawalId,
            });
            return { withdrawal };
        } catch (error) {
            return { error };
        }
    }

    static async proposeWithdrawal(assetPool: IAssetPool, memberAddress: string, amount: number) {
        try {
            // Check if is member
            const amountInWei = toWei(amount.toString());
            const tx = await sendTransaction(
                assetPool.address,
                assetPool.solution.methods.proposeWithdraw(amountInWei, memberAddress),
                assetPool.network,
            );
            const events = parseLogs(Artifacts.IDefaultDiamond.abi, tx.logs);
            const event = findEvent('WithdrawPollCreated', events);
            const { withdrawal } = await this.create(assetPool, event.args.id, event.args.member);

            return { withdrawal: await withdrawal.save() };
        } catch (error) {
            return { error };
        }
    }

    static async create(assetPool: IAssetPool, id: number, memberId: number, rewardId?: number) {
        try {
            return {
                withdrawal: new Withdrawal({
                    id,
                    amount: Number(
                        fromWei(await callFunction(assetPool.solution.methods.getAmount(id), assetPool.network)),
                    ),
                    poolAddress: assetPool.solution.options.address,
                    beneficiary: await callFunction(
                        assetPool.solution.methods.getAddressByMember(memberId),
                        assetPool.network,
                    ),
                    approved: await callFunction(
                        assetPool.solution.methods.withdrawPollApprovalState(id),
                        assetPool.network,
                    ),
                    state: WithdrawalState.Pending,
                    rewardId,
                    poll: {
                        startTime: Number(
                            await callFunction(assetPool.solution.methods.getStartTime(id), assetPool.network),
                        ),
                        endTime: Number(
                            await callFunction(assetPool.solution.methods.getEndTime(id), assetPool.network),
                        ),
                        yesCounter: 0,
                        noCounter: 0,
                        totalVoted: 0,
                    },
                }),
            };
        } catch (error) {
            return { error };
        }
    }

    static async withdrawPollFinalize(assetPool: IAssetPool, withdrawalId: number) {
        try {
            const withdrawal = await Withdrawal.findOne({
                poolAddress: assetPool.address,
                id: withdrawalId,
            });
            const tx = await sendTransaction(
                assetPool.solution.options.address,
                assetPool.solution.methods.withdrawPollFinalize(withdrawalId),
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
                ...(state || state === 0 ? { state } : {}),
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
            const withdrawal = await Withdrawal.findOne({ beneficiary, rewardId, poolAddress });

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

    static async countByPoolAddress(poolAddress: string) {
        try {
            const count = Withdrawal.countDocuments({ poolAddress });
            return count;
        } catch (error) {
            return { error };
        }
    }
}
