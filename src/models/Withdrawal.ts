import mongoose from 'mongoose';

export enum WithdrawalState {
    Pending = 0,
    Withdrawn = 1,
}

export type WithdrawalDocument = mongoose.Document & {
    id: number;
    poolAddress: string;
    beneficiary: string;
    amount: number;
    approved: boolean;
    state: number;
    poll: {
        startTime: number;
        endTime: number;
        yesCounter: number;
        noCounter: number;
        totalVoted: number;
    };
};

const withdrawalSchema = new mongoose.Schema(
    {
        id: Number,
        poolAddress: String,
        beneficiary: String,
        amount: Number,
        approved: Boolean,
        state: Number,
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
