import mongoose from 'mongoose';

export enum ChannelType {
    None = 0,
    Google = 1,
    Twitter = 2,
}

export enum ChannelAction {
    YouTubeLike = 0,
    YouTubeSubscribe = 1,
    TwitterLike = 2,
    TwitterRetweet = 3,
    TwitterFollow = 4,
    SpotfyFollow = 5,
    SpotifyPlaying = 7,
    SpotifySaved = 8,
    SpotifyPlayed = 9,
}

export enum RewardState {
    Disabled = 0,
    Enabled = 1,
}

export interface IRewardUpdates {
    withdrawAmount: number;
    withdrawDuration: number;
}

export interface IRewardCondition {
    channelType: ChannelType;
    channelAction: ChannelAction;
    channelItem: string;
}

export type RewardDocument = mongoose.Document & {
    id: number;
    poolAddress: string;
    state: number;
    isMembershipRequired: boolean;
    isClaimOnce: boolean;
    withdrawAmount: number;
    withdrawDuration: number;
    withdrawCondition: IRewardCondition;
    pollId: number;
};

export type RewardPollDocument = {
    id: number;
    withdrawAmount: number;
    withdrawDuration: number;
    startTime: number;
    endTime: number;
    yesCounter: number;
    noCounter: number;
    totalVoted: number;
};

const rewardSchema = new mongoose.Schema(
    {
        id: Number,
        poolAddress: String,
        state: Number,
        isMembershipRequired: Boolean,
        isClaimOnce: Boolean,
        withdrawAmount: Number,
        withdrawDuration: Number,
        withdrawCondition: {
            channelType: Number,
            channelAction: Number,
            channelItem: String,
        },
        pollId: Number,
    },
    { timestamps: true },
);

export const Reward = mongoose.model<RewardDocument>('Reward', rewardSchema);
