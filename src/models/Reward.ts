import mongoose from 'mongoose';

export enum ChannelType {
    None = 0,
    Google = 1,
}

export enum ChannelAction {
    None = 0,
    Like = 1,
    Subscribe = 2,
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
    withdrawAmount: number;
    withdrawDuration: number;
    poolAddress: string;
    state: number;
    condition: IRewardCondition;
    pollId: number;
    isMembershipRequired: boolean;
    isClaimOnce: boolean;
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
        withdrawAmount: Number,
        withdrawDuration: Number,
        poolAddress: String,
        beneficiaries: [String],
        condition: {
            channelType: Number,
            channelAction: Number,
            channelItem: String,
        },
        isMembershipRequired: Boolean,
        isClaimOnce: Boolean,
        state: Number,
    },
    { timestamps: true },
);

export const Reward = mongoose.model<RewardDocument>('Reward', rewardSchema);
