import mongoose from 'mongoose';

export enum WithdrawalType {
    ClaimReward = 0,
    ClaimRewardFor = 1,
    ProposeWithdraw = 2,
}

export enum WithdrawalState {
    Deferred = -1,
    Pending = 0,
    Withdrawn = 1,
}

interface WithdrawPoll {
    startTime: number;
    endTime: number;
    yesCounter: number;
    noCounter: number;
    totalVoted: number;
}

export type WithdrawalDocument = mongoose.Document & {
    type: WithdrawalType;
    poolAddress: string;
    beneficiary: string;
    amount: number;
    state: number;
    createdAt: Date;
    updatedAt: Date;
    approved?: boolean;
    failReason?: string;
    rewardId?: number;
    withdrawalId?: number;
    poll?: WithdrawPoll | null;
};

const WithdrawPollSchema = {
    startTime: Number,
    endTime: Number,
    yesCounter: Number,
    noCounter: Number,
    totalVoted: Number,
};

const withdrawalSchema = new mongoose.Schema(
    {
        type: Number,
        poolAddress: String,
        beneficiary: String,
        amount: Number,
        state: Number,
        approved: Boolean,
        failReason: String,
        rewardId: Number,
        withdrawalId: Number,
        poll: WithdrawPollSchema,
        createdAt: Date,
        updatedAt: Date,
    },
    { timestamps: true },
);
export const Withdrawal = mongoose.model<WithdrawalDocument>('Withdrawal', withdrawalSchema);
