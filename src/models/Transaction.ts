import { NetworkProvider } from '@/types/enums';
import { TTransaction } from '@/types/TTransaction';
import mongoose from 'mongoose';

export type TransactionDocument = mongoose.Document & TTransaction;

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
        maxFeePerGas: String,
        maxPriorityFeePerGas: String,
        state: Number,
        network: NetworkProvider,
    },
    { timestamps: true },
);

export const Transaction = mongoose.model<TransactionDocument>('Transaction', transactionSchema);
