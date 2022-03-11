import mongoose from 'mongoose';
import { TDeposit } from '@/types/TDeposit';

export type DepositDocument = mongoose.Document & TDeposit;

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
