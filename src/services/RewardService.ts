import BN from 'bn.js';
import { AssetPoolType } from '@/models/AssetPool';
import { IAccount } from '@/models/Account';
import { sendTransaction, callFunction } from '@/util/network';
import { Artifacts } from '@/util/artifacts';
import { parseLogs, findEvent } from '@/util/events';
import {
    ChannelAction,
    IRewardCondition,
    IRewardUpdates,
    Reward,
    RewardDocument,
    RewardState,
    TReward,
    TRewardPoll,
} from '@/models/Reward';
import { fromWei, toWei } from 'web3-utils';

import WithdrawalService from './WithdrawalService';

import YouTubeDataProxy from '@/proxies/YoutubeDataProxy';
import TwitterDataProxy from '@/proxies/TwitterDataProxy';

export default class RewardService {
    static async get(assetPool: AssetPoolType, rewardId: number): Promise<RewardDocument> {
        const reward = await Reward.findOne({ poolAddress: assetPool.address, id: rewardId });

        if (!reward) return reward;

        const { id, withdrawAmount, withdrawDuration, pollId, state } = await callFunction(
            assetPool.solution.methods.getReward(rewardId),
            assetPool.network,
        );

        reward.id = id;
        reward.withdrawAmount = Number(fromWei(withdrawAmount));
        reward.withdrawDuration = withdrawDuration;
        reward.pollId = pollId;
        reward.state = state;

        return reward;
    }

    static async findByPoolAddress(assetPool: AssetPoolType): Promise<RewardDocument[]> {
        const rewards = [];
        for (const r of await Reward.find({ poolAddress: assetPool.address })) {
            rewards.push(await this.get(assetPool, r.id));
        }
        return rewards;
    }

    static async getRewardPoll(assetPool: AssetPoolType, pollId: number): Promise<TRewardPoll> {
        if (pollId < 1) return;

        const res = await Promise.all([
            callFunction(assetPool.solution.methods.getWithdrawAmount(pollId), assetPool.network),
            callFunction(assetPool.solution.methods.getWithdrawDuration(pollId), assetPool.network),
            callFunction(assetPool.solution.methods.getStartTime(pollId), assetPool.network),
            callFunction(assetPool.solution.methods.getEndTime(pollId), assetPool.network),
            callFunction(assetPool.solution.methods.getYesCounter(pollId), assetPool.network),
            callFunction(assetPool.solution.methods.getNoCounter(pollId), assetPool.network),
            callFunction(assetPool.solution.methods.getTotalVoted(pollId), assetPool.network),
        ]);

        return {
            id: pollId,
            withdrawAmount: Number(fromWei(res[0])),
            withdrawDuration: Number(res[1]),
            startTime: Number(res[2]),
            endTime: Number(res[3]),
            yesCounter: Number(res[4]),
            noCounter: Number(res[5]),
            totalVoted: Number(res[6]),
        };
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
                default:
                    return Promise.resolve(false);
            }
        }

        // Can not claim if the reward is disabled
        if (reward.state === RewardState.Disabled) {
            return false;
        }

        const withdrawal = await WithdrawalService.hasClaimedOnce(assetPool.address, account.address, reward.id);
        // Can only claim this reward once and a withdrawal already exists
        if (reward.isClaimOnce && withdrawal) {
            return false;
        }

        // Can claim if no condition and channel are set
        if (!reward.withdrawCondition || !reward.withdrawCondition.channelType) {
            return true;
        }

        return await validate(reward.withdrawCondition.channelAction, reward.withdrawCondition.channelItem);
    }

    static async claimRewardFor(assetPool: AssetPoolType, id: string, rewardId: number, beneficiary: string) {
        const tx = await sendTransaction(
            assetPool.solution.options.address,
            assetPool.solution.methods.claimRewardFor(rewardId, beneficiary),
            assetPool.network,
        );
        const events = parseLogs(Artifacts.IDefaultDiamond.abi, tx.logs);
        const event = findEvent('WithdrawPollCreated', events);

        return await WithdrawalService.update(assetPool, id, {
            withdrawalId: event.args.id,
            memberId: event.args.member,
            rewardId,
        });
    }

    static async removeAllForAddress(address: string) {
        const rewards = await Reward.find({ poolAddress: address });
        for (const r of rewards) {
            await r.remove();
        }
    }

    static async create(
        assetPool: AssetPoolType,
        withdrawAmount: BN,
        withdrawDuration: number,
        isMembershipRequired: boolean,
        isClaimOnce: boolean,
        withdrawCondition?: IRewardCondition,
    ) {
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
            withdrawAmount: Number(
                fromWei(await callFunction(assetPool.solution.methods.getWithdrawAmount(id), assetPool.network)),
            ),
            withdrawDuration: await callFunction(assetPool.solution.methods.getWithdrawDuration(id), assetPool.network),
            withdrawCondition,
            state: RewardState.Disabled,
            isMembershipRequired,
            isClaimOnce,
        });

        return await reward.save();
    }

    static async update(
        assetPool: AssetPoolType,
        reward: RewardDocument,
        { withdrawAmount, withdrawDuration }: IRewardUpdates,
    ) {
        const withdrawAmountInWei = toWei(withdrawAmount.toString());
        const tx = await sendTransaction(
            assetPool.solution.options.address,
            assetPool.solution.methods.updateReward(reward.id, withdrawAmountInWei, withdrawDuration),
            assetPool.network,
        );
        const events = parseLogs(Artifacts.IDefaultDiamond.abi, tx.logs);
        const event = findEvent('RewardPollCreated', events);

        reward.pollId = Number(event.args.id);

        return reward.save();
    }

    static async finalizePoll(assetPool: AssetPoolType, reward: RewardDocument) {
        const { pollId } = await callFunction(assetPool.solution.methods.getReward(reward.id), assetPool.network);
        const tx = await sendTransaction(
            assetPool.solution.options.address,
            assetPool.solution.methods.rewardPollFinalize(pollId),
            assetPool.network,
        );
        const events = parseLogs(Artifacts.IDefaultDiamond.abi, tx.logs);
        const eventRewardPollEnabled = findEvent('RewardPollEnabled', events);
        const eventRewardPollUpdated = findEvent('RewardPollUpdated', events);

        if (!eventRewardPollEnabled && !eventRewardPollUpdated) {
            return reward;
        }

        const updatedReward = await this.get(assetPool, reward.id);
        return await updatedReward.save();
    }

    static async enable(assetPool: AssetPoolType, reward: RewardDocument) {
        await sendTransaction(
            assetPool.solution.options.address,
            assetPool.solution.methods.enableReward(reward.id),
            assetPool.network,
        );
        return await this.get(assetPool, reward.id);
    }

    static async disable(assetPool: AssetPoolType, reward: RewardDocument) {
        const tx = await sendTransaction(
            assetPool.solution.options.address,
            assetPool.solution.methods.disableReward(reward.id),
            assetPool.network,
        );
        return await this.get(assetPool, reward.id);
    }
}
