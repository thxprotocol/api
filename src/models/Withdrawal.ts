import mongoose from 'mongoose';
import { TWithdrawal } from '@/types/TWithdrawal';

export type WithdrawalDocument = mongoose.Document & TWithdrawal;

const withdrawalSchema = new mongoose.Schema(
    {
        state: Number,
        type: Number,
        poolAddress: String,
        sub: String,
        beneficiary: String,
        amount: Number,
        rewardId: Number,
        withdrawalId: Number,
        transactions: [String],
        failReason: String,
    },
    { timestamps: true },
);
export const Withdrawal = mongoose.model<WithdrawalDocument>('Withdrawal', withdrawalSchema);
