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
    SpotifyUserFollow = 5,
    SpotifyPlaylistFollow = 6,
    SpotifyTrackPlaying = 7,
    SpotifyTrackSaved = 8,
    SpotifyTrackRecent = 9,
}

export enum RewardState {
    Disabled = 0,
    Enabled = 1,
}

export interface IRewardUpdates {
    withdrawAmount?: number;
    withdrawDuration?: number;
    state?: RewardState;
}

export interface IRewardCondition {
    channelType: ChannelType;
    channelAction: ChannelAction;
    channelItem: string;
}

export type TReward = {
    _id?: string;
    id: number;
    title: string;
    slug: string;
    poolAddress: string;
    state: number;
    expiryDate: Date;
    isMembershipRequired: boolean;
    isClaimOnce: boolean;
    withdrawLimit: number;
    withdrawAmount: number;
    withdrawDuration: number;
    withdrawCondition: IRewardCondition;
    withdrawUnlockDate: Date;
    progress?: number;
};

export type RewardDocument = mongoose.Document & TReward;

export type TRewardPoll = {
    id: number;
    withdrawAmount: number;
    withdrawDuration: number;
    withdrawUnlockDate: Date;
    startTime: number;
    endTime: number;
    yesCounter: number;
    noCounter: number;
    totalVoted: number;
};

const rewardSchema = new mongoose.Schema(
    {
        id: Number,
        title: String,
        slug: String,
        expiryDate: Date,
        poolAddress: String,
        state: Number,
        isMembershipRequired: Boolean,
        isClaimOnce: Boolean,
        withdrawLimit: Number,
        withdrawAmount: Number,
        withdrawDuration: Number,
        withdrawCondition: {
            channelType: Number,
            channelAction: Number,
            channelItem: String,
        },
        withdrawUnlockDate: Date,
        pollId: Number,
    },
    { timestamps: true },
);

export const Reward = mongoose.model<RewardDocument>('Reward', rewardSchema);
