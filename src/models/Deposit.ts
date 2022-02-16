import mongoose from 'mongoose';
import { DepositType } from '@/types/Deposit';

export type DepositDocument = mongoose.Document & DepositType;

const DepositSchema = new mongoose.Schema(
    {
        sub: String,
        amount: Number,
        sender: String,
        receiver: String,
        item: String,
        state: Number,
        fromBlock: Number,
    },
    { timestamps: true },
);

export const Deposit = mongoose.model<DepositDocument>('Deposit', DepositSchema, 'deposits');
