import mongoose from 'mongoose';

export type ContractEventDocument = mongoose.Document & {
    transactionHash: string;
    contractAddress: string;
    name: string;
    args: any;
    blockNumber: number;
};

const contractEventSchema = new mongoose.Schema(
    {
        transactionHash: String,
        contractAddress: String,
        name: String,
        args: Object,
        blockNumber: Number,
    },
    { timestamps: true },
);
export const ContractEvent = mongoose.model<ContractEventDocument>('contract_event', contractEventSchema);
