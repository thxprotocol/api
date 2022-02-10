import BN from 'bn.js';
import { IAssetPool } from '../models/AssetPool';
import { IAccount } from '../models/Account';
import { sendTransaction, callFunction } from '../util/network';
import { Artifacts } from '../util/artifacts';
import { parseLogs, findEvent } from '../util/events';
import { ChannelAction, IRewardCondition, IRewardUpdates, Reward, RewardDocument, RewardState } from '../models/Reward';
import { fromWei, toWei } from 'web3-utils';

import WithdrawalService from './WithdrawalService';

import YouTubeDataProxy from '../proxies/YoutubeDataProxy';
import TwitterDataProxy from '../proxies/TwitterDataProxy';
import { logger } from '../util/logger';

export default class RewardService {
    static async get(assetPool: IAssetPool, rewardId: number) {
        try {
            const reward = await Reward.findOne({ poolAddress: assetPool.address, id: rewardId });

            if (!reward) return { reward };

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
        async function validateYouTubeLike(channelItem: string) {
            const { result, error } = await YouTubeDataProxy.validateLike(account, channelItem);
            if (error) throw new Error('Could not validate YouTube like');
            return result;
        }
        async function validateYouTubeSubscribe(channelItem: string) {
            const { result, error } = await YouTubeDataProxy.validateSubscribe(account, channelItem);
            if (error) throw new Error('Could not validate YouTube subscribe');
            return result;
        }
        async function validateTwitterLike(channelItem: string) {
            const { result, error } = await TwitterDataProxy.validateLike(account, channelItem);
            if (error) throw new Error('Could not validate Twitter like');
            return result;
        }
        async function validateTwitterRetweet(channelItem: string) {
            const { result, error } = await TwitterDataProxy.validateRetweet(account, channelItem);
            if (error) throw new Error('Could not validate Twitter retweet');
            return result;
        }
        async function validateTwitterFollow(channelItem: string) {
            const { result, error } = await TwitterDataProxy.validateFollow(account, channelItem);
            if (error) throw new Error('Could not validate Twitter follow');
            return result;
        }
        async function validate(channelAction: ChannelAction, channelItem: string) {
            switch (channelAction) {
                case ChannelAction.YouTubeLike:
                    return await validateYouTubeLike(channelItem);
                case ChannelAction.YouTubeSubscribe:
                    return await validateYouTubeSubscribe(channelItem);
                case ChannelAction.TwitterLike:
                    return await validateTwitterLike(channelItem);
                case ChannelAction.TwitterRetweet:
                    return await validateTwitterRetweet(channelItem);
                case ChannelAction.TwitterFollow:
                    return await validateTwitterFollow(channelItem);
                default:
                    return false;
            }
        }

        try {
            const { withdrawal } = await WithdrawalService.hasClaimedOnce(
                assetPool.address,
                account.address,
                reward.id,
            );

            if (reward.isClaimOnce && withdrawal) {
                return { canClaim: false };
            }

            if (!reward.withdrawCondition || !reward.withdrawCondition.channelType) {
                return { canClaim: true };
            }

            const canClaim = await validate(
                reward.withdrawCondition.channelAction,
                reward.withdrawCondition.channelItem,
            );

            return { canClaim };
        } catch (error) {
            return { error };
        }
    }

    static async claimRewardFor(assetPool: IAssetPool, id: string, rewardId: number, beneficiary: string) {
        const tx = await sendTransaction(
            assetPool.solution.options.address,
            assetPool.solution.methods.claimRewardFor(rewardId, beneficiary),
            assetPool.network,
            null,
            assetPool.sub,
        );
        const events = parseLogs(Artifacts.IDefaultDiamond.abi, tx.logs);
        const event = findEvent('WithdrawPollCreated', events);

        // TODO Should wait for the receipt here
        return await WithdrawalService.update(assetPool, id, {
            withdrawalId: event.args.id,
            memberId: event.args.member,
            rewardId,
        });
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
                null,
                assetPool.sub,
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
                null,
                assetPool.sub,
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
                null,
                assetPool.sub,
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
