import mongoose from 'mongoose';
import { solutionContract } from '@/util/network';
import { Contract } from 'web3-eth-contract';

export type AssetPoolType = {
    address: string;
    solution: Contract;
    network: number;
    latestAdminNonce: number;
    sub: string;
    clientId: string;
    blockNumber: number;
    transactionHash: string;
    bypassPolls: boolean;
    version?: string;
};

export type AssetPoolDocument = mongoose.Document & AssetPoolType;

const assetPoolSchema = new mongoose.Schema(
    {
        address: String,
        network: Number,
        latestAdminNonce: Number,
        sub: String,
        clientId: String,
        blockNumber: Number,
        transactionHash: String,
        bypassPolls: Boolean,
        version: String,
    },
    { timestamps: true },
);

assetPoolSchema.virtual('solution').get(function () {
    return solutionContract(this.network, this.address);
});

export const AssetPool = mongoose.model<AssetPoolDocument>('AssetPool', assetPoolSchema);
