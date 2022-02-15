import mongoose from 'mongoose';
import { IWithdrawal } from '@/types/IWithdrawal';

export type WithdrawalDocument = mongoose.Document & IWithdrawal;

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
        fromBlock: Number,
        poll: {
            startTime: Number,
            endTime: Number,
            yesCounter: Number,
            noCounter: Number,
            totalVoted: Number,
        },
        createdAt: Date,
        updatedAt: Date,
    },
    { timestamps: true },
);
export const Withdrawal = mongoose.model<WithdrawalDocument>('Withdrawal', withdrawalSchema);
