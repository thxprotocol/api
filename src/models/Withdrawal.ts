import mongoose from 'mongoose';
import { TWithdrawal } from '@/types/Withdrawal';

export type WithdrawalDocument = mongoose.Document & TWithdrawal;

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
    },
    { timestamps: true },
);
export const Withdrawal = mongoose.model<WithdrawalDocument>('Withdrawal', withdrawalSchema);
