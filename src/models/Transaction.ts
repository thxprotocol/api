import { TransactionState, TransactionType } from '@/types/enums';
import mongoose from 'mongoose';

export type TransactionDocument = mongoose.Document & {
    type: TransactionType;
    state: TransactionState;
    from: string;
    to: string;
    nonce: number;
    gas: string;
    transactionHash: string;
    relayTransactionHash: string;
    baseFee?: string;
    maxFeeForGas?: string;
    maxPriorityFeeForGas?: string;
};

const transactionSchema = new mongoose.Schema(
    {
        id: String,
        from: String,
        to: String,
        nonce: Number,
        transactionHash: String,
        relayTransactionHash: String,
        gas: String,
        baseFee: String,
        maxFeeForGas: String,
        maxPriorityFeeForGas: String,
        state: Number,
    },
    { timestamps: true },
);

export const Transaction = mongoose.model<TransactionDocument>('Transaction', transactionSchema);
