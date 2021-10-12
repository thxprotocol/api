import { IAssetPool } from '../models/AssetPool';
import { sendTransaction, callFunction } from '../util/network';
import { Artifacts } from '../util/artifacts';
import { parseLogs, findEvent } from '../util/events';
import { Reward, RewardDocument } from '../models/Reward';
import WithdrawalService from './WithdrawalService';
import { Contract } from 'web3-eth-contract';

const ERROR_REWARD_GET_FAILED = 'Could not get the reward information from the database';
const TRANSACTION_EVENT_ERROR = 'Could not parse the transaction event logs.';
const REWARD_ERROR = 'Could not finalize the reward.';
const ERROR_GOVERNANCE_DISABLED = 'Could determine if governance is disabled for this reward.';
const DATABASE_STORE_ERROR = 'Could not store the reward in the database.';

export default class RewardService {
    static async get(poolAddress: string, rewardId: number) {
        try {
            const reward = await Reward.findOne({ poolAddress, id: rewardId });

            return { reward };
        } catch (error) {
            return { error: ERROR_REWARD_GET_FAILED };
        }
    }

    static async canClaim(reward: RewardDocument, address: string) {
        try {
            const hasClaimed = reward.beneficiaries.includes(address);
            return { canClaim: !hasClaimed };
        } catch (error) {
            return { error };
        }
    }

    static async claimRewardFor(assetPool: IAssetPool, rewardId: number, address: string) {
        try {
            const tx = await sendTransaction(
                assetPool.solution.options.address,
                assetPool.solution.methods.claimRewardFor(rewardId, address),
                assetPool.network,
            );

            const events = parseLogs(Artifacts.IDefaultDiamond.abi, tx.logs);
            const event = findEvent('WithdrawPollCreated', events);
            const withdrawal = await WithdrawalService.save(assetPool, event.args.id, event.args.member);

            return { withdrawal };
        } catch (error) {
            return { error };
        }
    }

    static async claimRewardForOnce(assetPool: IAssetPool, rewardId: number, address: string) {
        try {
            const { withdrawal, error } = await this.claimRewardFor(assetPool, rewardId, address);

            if (error) {
                throw new Error('fail');
            }

            const reward = await Reward.findOne({ poolAddress: assetPool.address, id: rewardId });

            if (reward.beneficiaries.length) {
                reward.beneficiaries.push(address);
            } else {
                reward.beneficiaries = [address];
            }

            await reward.save();
            await withdrawal.save();

            return { withdrawal };
        } catch (error) {
            return { error };
        }
    }

    static async removeAllForAddress(address: string) {
        try {
            const rewards = await Reward.find({ poolAddress: address });
            for (const r of rewards) {
                await r.remove();
            }
        } catch (error) {
            return { error };
        }
    }

    static async create(assetPool: IAssetPool, solution: Contract, id: number, pollId: number, state: number) {
        try {
            const reward = new Reward({
                id,
                poolAddress: solution.options.address,
                withdrawAmount: await callFunction(solution.methods.getWithdrawAmount(id), assetPool.network),
                withdrawDuration: await callFunction(solution.methods.getWithdrawDuration(id), assetPool.network),
                state,
            });
            await reward.save();
            try {
                const duration = Number(
                    await callFunction(solution.methods.getRewardPollDuration(), assetPool.network),
                );

                if (assetPool.bypassPolls && duration === 0) {
                    const { error } = await this.finalizePoll(assetPool, solution, reward, pollId);
                    if (error) {
                        return { error };
                    }
                }
            } catch (e) {
                const error = ERROR_GOVERNANCE_DISABLED;
                return { error };
            }
        } catch (e) {
            const error = DATABASE_STORE_ERROR;
            return { error };
        }
    }

    static async finalizePoll(assetPool: IAssetPool, solution: Contract, reward: RewardDocument, pollId: number) {
        try {
            const tx = await sendTransaction(
                solution.options.address,
                solution.methods.rewardPollFinalize(pollId),
                assetPool.network,
            );

            try {
                const events = parseLogs(Artifacts.IDefaultDiamond.abi, tx.logs);
                const event = findEvent('RewardPollEnabled', events);

                if (event) {
                    reward.withdrawAmount = await callFunction(
                        solution.methods.getWithdrawAmount(reward.id),
                        assetPool.network,
                    );
                    reward.state = 1;
                    await reward.save();
                }
            } catch (err) {
                const error = TRANSACTION_EVENT_ERROR;
                return { error };
            }
        } catch (e) {
            const error = REWARD_ERROR;
            return { error };
        }
    }

    static async countByPoolAddress(poolAddress: string) {
        try {
            const count = Reward.countDocuments({ poolAddress });
            return count;
        } catch (error) {
            return { error };
        }
    }
}
