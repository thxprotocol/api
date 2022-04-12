import { IAccount } from '@/models/Account';
import {
    ChannelAction,
    IRewardCondition,
    IRewardUpdates,
    Reward,
    RewardDocument,
    RewardState,
    TReward,
} from '@/models/Reward';
import { AssetPoolType } from '@/models/AssetPool';
import TwitterDataProxy from '@/proxies/TwitterDataProxy';
import YouTubeDataProxy from '@/proxies/YoutubeDataProxy';
import SpotifyDataProxy from '@/proxies/SpotifyDataProxy';
import WithdrawalService from './WithdrawalService';
import { ForbiddenError } from '@/util/errors';

export default class RewardService {
    static async get(assetPool: AssetPoolType, rewardId: number): Promise<RewardDocument> {
        const reward = await Reward.findOne({ poolAddress: assetPool.address, id: rewardId });
        if (!reward) return null;
        return reward;
    }

    static async findByPoolAddress(assetPool: AssetPoolType): Promise<RewardDocument[]> {
        const rewards = [];
        for (const r of await Reward.find({ poolAddress: assetPool.address })) {
            rewards.push(await this.get(assetPool, r.id));
        }
        return rewards;
    }

    static async rewardProgress(reward: TReward) {
        const withdrawed = await WithdrawalService.getByPoolAndRewardID(reward.poolAddress, reward.id);
        const totalWithdrawed = withdrawed.reduce((total, withdraw) => (total += withdraw.amount), 0);
        return totalWithdrawed;
    }

    static async canClaim(assetPool: AssetPoolType, reward: TReward, account: IAccount): Promise<boolean> {
        function validate(channelAction: ChannelAction, channelItem: string): Promise<boolean> {
            switch (channelAction) {
                case ChannelAction.YouTubeLike:
                    return YouTubeDataProxy.validateLike(account, channelItem);
                case ChannelAction.YouTubeSubscribe:
                    return YouTubeDataProxy.validateSubscribe(account, channelItem);

                case ChannelAction.TwitterLike:
                    return TwitterDataProxy.validateLike(account, channelItem);
                case ChannelAction.TwitterRetweet:
                    return TwitterDataProxy.validateRetweet(account, channelItem);
                case ChannelAction.TwitterFollow:
                    return TwitterDataProxy.validateFollow(account, channelItem);

                case ChannelAction.SpotifyUserFollow:
                    return SpotifyDataProxy.validateUserFollow(account, channelItem);
                case ChannelAction.SpotifyPlaylistFollow:
                    return SpotifyDataProxy.validatePlaylistFollow(account, channelItem);
                case ChannelAction.SpotifyTrackPlaying:
                    return SpotifyDataProxy.validateTrackPlaying(account, channelItem);
                case ChannelAction.SpotifyTrackRecent:
                    return SpotifyDataProxy.validateRecentTrack(account, channelItem);
                case ChannelAction.SpotifyTrackSaved:
                    return SpotifyDataProxy.validateSavedTracks(account, channelItem);

                default:
                    return Promise.resolve(false);
            }
        }

        // Can not claim if the reward is disabled
        if (reward.state === RewardState.Disabled) {
            throw new ForbiddenError('This reward already disabled by it owner');
        }

        // Can not claim if reward already extends the claim limit
        // (included pending withdrawars)
        if (reward.withdrawLimit > 0) {
            const totalWithdrawed = await this.rewardProgress(reward);
            if (totalWithdrawed >= reward.withdrawLimit) {
                throw new ForbiddenError('This reward is reached it limit');
            }
        }

        const withdrawal = await WithdrawalService.hasClaimedOnce(assetPool.address, account.id, reward.id);
        // Can only claim this reward once and a withdrawal already exists
        if (reward.isClaimOnce && withdrawal) {
            throw new ForbiddenError('You have already claimed this reward');
        }

        // Can claim if no condition and channel are set
        if (!reward.withdrawCondition || !reward.withdrawCondition.channelType) {
            return true;
        }

        return await validate(reward.withdrawCondition.channelAction, reward.withdrawCondition.channelItem);
    }

    static async removeAllForAddress(address: string) {
        const rewards = await Reward.find({ poolAddress: address });
        for (const r of rewards) {
            await r.remove();
        }
    }

    static async create(
        assetPool: AssetPoolType,
        withdrawLimit: number,
        withdrawAmount: number,
        withdrawDuration: number,
        isMembershipRequired: boolean,
        isClaimOnce: boolean,
        withdrawCondition?: IRewardCondition,
    ) {
        // Calculates an incrementing id as was done in Solidity before.
        // TODO Add migration to remove id and start using default collection _id.
        const id = (await this.findByPoolAddress(assetPool)).length + 1;
        return await Reward.create({
            id,
            poolAddress: assetPool.address,
            withdrawAmount: String(withdrawAmount),
            withdrawLimit,
            withdrawDuration,
            withdrawCondition,
            state: RewardState.Enabled,
            isMembershipRequired,
            isClaimOnce,
        });
    }

    static update(reward: RewardDocument, updates: IRewardUpdates) {
        return Reward.findByIdAndUpdate(reward._id, updates, { new: true });
    }
}
