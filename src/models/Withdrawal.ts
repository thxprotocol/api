import mongoose from 'mongoose';

export enum WithdrawalState {
    Pending = 0,
    Withdrawn = 1,
}

export type WithdrawalDocument = mongoose.Document & {
    poolAddress: string;
    beneficiary: string;
    amount: number;
    approved: boolean;
    state: number;
    job: any;
    jobId: string;
    withdrawalId: number;
    rewardId: number;
    poll: {
        startTime: number;
        endTime: number;
        yesCounter: number;
        noCounter: number;
        totalVoted: number;
    } | null;
};

const withdrawalSchema = new mongoose.Schema(
    {
        poolAddress: String,
        beneficiary: String,
        amount: Number,
        approved: Boolean,
        state: Number,
        jobId: String,
        withdrawalId: Number,
        rewardId: Number,
        poll: {
            startTime: Number,
            endTime: Number,
            yesCounter: Number,
            noCounter: Number,
            totalVoted: Number,
        },
    },
    { timestamps: true },
);
export const Withdrawal = mongoose.model<WithdrawalDocument>('Withdrawal', withdrawalSchema);
