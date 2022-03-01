import mongoose from 'mongoose';

export enum TransactionState {
    Pending = 0,
    Mined = 1,
    Failed = 2,
}

export type TransactionDocument = mongoose.Document & {
    id: string;
    from: string;
    to: string;
    transactionHash: string;
    gas: string;
    baseFee: string;
    maxFeeForGas: string;
    maxPriorityFeeForGas: string;
    state: TransactionState;
};

const transactionSchema = new mongoose.Schema(
    {
        id: String,
        from: String,
        to: String,
        transactionHash: String,
        gas: String,
        baseFee: String,
        maxFeeForGas: String,
        maxPriorityFeeForGas: String,
        state: Number,
    },
    { timestamps: true },
);

export const Transaction = mongoose.model<TransactionDocument>('Transaction', transactionSchema);
