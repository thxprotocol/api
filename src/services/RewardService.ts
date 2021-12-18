import YouTubeDataProxy from '../proxies/YoutubeDataProxy';
import WithdrawalService from './WithdrawalService';
import BN from 'bn.js';
import { IAssetPool } from '../models/AssetPool';
import { IAccount } from '../models/Account';
import { sendTransaction, callFunction } from '../util/network';
import { Artifacts } from '../util/artifacts';
import { parseLogs, findEvent } from '../util/events';
import {
    ChannelAction,
    ChannelType,
    IRewardCondition,
    IRewardUpdates,
    Reward,
    RewardDocument,
    RewardState,
} from '../models/Reward';
import { fromWei } from 'web3-utils';
import { toWei } from 'web3-utils';

export default class RewardService {
    static async get(assetPool: IAssetPool, rewardId: number) {
        try {
            const reward = await Reward.findOne({ poolAddress: assetPool.address, id: rewardId });
            const { id, withdrawAmount, withdrawDuration, pollId, state } = await callFunction(
                assetPool.solution.methods.getReward(rewardId),
                assetPool.network,
            );

            reward.id = Number(id);
            reward.withdrawAmount = Number(fromWei(withdrawAmount));
            reward.withdrawDuration = Number(withdrawDuration);
            reward.state = state;
            reward.pollId = Number(pollId);

            return {
                reward,
            };
        } catch (error) {
            return { error };
        }
    }

    static async getRewardPoll(assetPool: IAssetPool, pollId: number) {
        try {
            const withdrawAmount = Number(
                fromWei(await callFunction(assetPool.solution.methods.getWithdrawAmount(pollId), assetPool.network)),
            );
            const withdrawDuration = Number(
                await callFunction(assetPool.solution.methods.getWithdrawDuration(pollId), assetPool.network),
            );
            const startTime = Number(
                await callFunction(assetPool.solution.methods.getStartTime(pollId), assetPool.network),
            );
            const endTime = Number(
                await callFunction(assetPool.solution.methods.getEndTime(pollId), assetPool.network),
            );
            const yesCounter = Number(
                await callFunction(assetPool.solution.methods.getYesCounter(pollId), assetPool.network),
            );
            const noCounter = Number(
                await callFunction(assetPool.solution.methods.getNoCounter(pollId), assetPool.network),
            );
            const totalVoted = Number(
                await callFunction(assetPool.solution.methods.getTotalVoted(pollId), assetPool.network),
            );

            return {
                poll: {
                    id: pollId,
                    withdrawAmount,
                    withdrawDuration,
                    startTime,
                    endTime,
                    yesCounter,
                    noCounter,
                    totalVoted,
                },
            };
        } catch (error) {
            return { error };
        }
    }

    static async canClaim(assetPool: IAssetPool, reward: RewardDocument, account: IAccount) {
        async function validateLike(channelItem: string) {
            const { result, error } = await YouTubeDataProxy.validateLike(account, channelItem);
            if (error) throw new Error('Could not validate like');
            return result;
        }

        async function validateSubscribe(channelItem: string) {
            const { result, error } = await YouTubeDataProxy.validateSubscribe(account, channelItem);
            if (error) throw new Error('Could not validate subscribe');
            return result;
        }

        try {
            const { withdrawal } = await WithdrawalService.hasClaimedOnce(
                assetPool.address,
                account.address,
                reward.id,
            );

            if (withdrawal && reward.isClaimOnce) {
                return { canClaim: false };
            }

            if (!reward.withdrawCondition) {
                return { canClaim: true };
            }

            switch (reward.withdrawCondition.channelType) {
                case ChannelType.Google:
                    switch (reward.withdrawCondition.channelAction) {
                        case ChannelAction.Like:
                            return {
                                canClaim: await validateLike(reward.withdrawCondition.channelItem),
                            };
                        case ChannelAction.Subscribe:
                            return {
                                canClaim: await validateSubscribe(reward.withdrawCondition.channelItem),
                            };
                        // Extend with more cases within this channel
                        default:
                            return { canClaim: false };
                    }
                // Extend with more channels
                default:
                    return { canClaim: false };
            }
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
            const { withdrawal } = await WithdrawalService.create(
                assetPool,
                event.args.id,
                event.args.member,
                rewardId,
            );

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
            return { result: true };
        } catch (error) {
            return { error };
        }
    }

    static async create(
        assetPool: IAssetPool,
        withdrawAmount: BN,
        withdrawDuration: number,
        isMembershipRequired: boolean,
        isClaimOnce: boolean,
        withdrawCondition?: IRewardCondition,
    ) {
        try {
            const tx = await sendTransaction(
                assetPool.solution.options.address,
                assetPool.solution.methods.addReward(withdrawAmount, withdrawDuration),
                assetPool.network,
            );
            const events = parseLogs(Artifacts.IDefaultDiamond.abi, tx.logs);
            const event = findEvent('RewardPollCreated', events);
            const id = Number(event.args.rewardID);
            const reward = new Reward({
                id,
                poolAddress: assetPool.solution.options.address,
                withdrawAmount: await callFunction(assetPool.solution.methods.getWithdrawAmount(id), assetPool.network),
                withdrawDuration: await callFunction(
                    assetPool.solution.methods.getWithdrawDuration(id),
                    assetPool.network,
                ),
                withdrawCondition,
                state: RewardState.Disabled,
                isMembershipRequired,
                isClaimOnce,
            });

            return { reward: await reward.save() };
        } catch (error) {
            return {
                error,
            };
        }
    }

    static async update(assetPool: IAssetPool, rewardId: number, { withdrawAmount, withdrawDuration }: IRewardUpdates) {
        try {
            const withdrawAmountInWei = toWei(withdrawAmount.toString());
            const tx = await sendTransaction(
                assetPool.solution.options.address,
                assetPool.solution.methods.updateReward(rewardId, withdrawAmountInWei, withdrawDuration),
                assetPool.network,
            );
            const events = parseLogs(Artifacts.IDefaultDiamond.abi, tx.logs);
            const event = findEvent('RewardPollCreated', events);
            const pollId = Number(event.args.id);

            return { pollId };
        } catch (error) {
            return { error };
        }
    }

    static async finalizePoll(assetPool: IAssetPool, reward: RewardDocument) {
        try {
            const { pollId } = await callFunction(assetPool.solution.methods.getReward(reward.id), assetPool.network);
            const tx = await sendTransaction(
                assetPool.solution.options.address,
                assetPool.solution.methods.rewardPollFinalize(pollId),
                assetPool.network,
            );
            const events = parseLogs(Artifacts.IDefaultDiamond.abi, tx.logs);
            const eventRewardPollEnabled = findEvent('RewardPollEnabled', events);
            const eventRewardPollUpdated = findEvent('RewardPollUpdated', events);

            if (eventRewardPollEnabled) {
                reward.withdrawAmount = await callFunction(
                    assetPool.solution.methods.getWithdrawAmount(reward.id),
                    assetPool.network,
                );
                reward.withdrawDuration = await callFunction(
                    assetPool.solution.methods.getWithdrawDuration(reward.id),
                    assetPool.network,
                );
                reward.state = RewardState.Enabled;

                await reward.save();
            }

            if (eventRewardPollUpdated) {
                const withdrawAmount = Number(fromWei(eventRewardPollUpdated.args.amount.toString()));
                const withdrawDuration = Number(eventRewardPollUpdated.args.duration);

                reward.withdrawAmount = withdrawAmount;
                reward.withdrawDuration = withdrawDuration;

                await reward.save();
            }
            return { finalizedReward: reward };
        } catch (error) {
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
