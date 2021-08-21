import { Contract } from 'web3-eth-contract';
import mongoose from 'mongoose';

export type IAssetPool = mongoose.Document & {
    address: string;
    solution: Contract;
    network: number;
    sub: string;
    rat: string;
    blockNumber: number;
    transactionHash: string;
    bypassPolls: boolean;
};

const assetPoolSchema = new mongoose.Schema(
    {
        address: String,
        network: Number,
        sub: String,
        rat: String,
        blockNumber: Number,
        transactionHash: String,
        bypassPolls: Boolean,
    },
    { timestamps: true },
);
export const AssetPool = mongoose.model<IAssetPool>('AssetPool', assetPoolSchema);
