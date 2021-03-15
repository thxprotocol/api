import mongoose from 'mongoose';

export enum WithdrawalState {
    Pending = 0,
    Approved = 1,
    Rejected = 2,
    Withdrawn = 3,
}

export type WithdrawalDocument = mongoose.Document & {
    id: number;
    beneficiary: string;
    amount: number;
    approved: boolean;
    poll: {
        startTime: number;
        endTime: number;
        yesCounter: number;
        noCounter: number;
        totalVotes: number;
    };
};

const withdrawalSchema = new mongoose.Schema(
    {
        id: Number,
        amount: Number,
        beneficiary: String,
    },
    { timestamps: true },
);
export const Withdrawal = mongoose.model<WithdrawalDocument>('Withdrawal', withdrawalSchema);
