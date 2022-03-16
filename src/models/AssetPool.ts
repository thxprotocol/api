import mongoose from 'mongoose';
import { getContractFromAbi } from '@/util/network';
import { Contract } from 'web3-eth-contract';
import { diamondAbi } from '@/config/contracts';

export type AssetPoolType = {
    address: string;
    contract: Contract;
    network: number;
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
        sub: String,
        clientId: String,
        blockNumber: Number,
        transactionHash: String,
        bypassPolls: Boolean,
        version: String,
    },
    { timestamps: true },
);

assetPoolSchema.virtual('contract').get(function () {
    // Later we can change defaultpool to the actual configuration and add the version of the pool as well.
    return getContractFromAbi(this.network, diamondAbi(this.network, 'defaultPool'), this.address);
});

export const AssetPool = mongoose.model<AssetPoolDocument>('AssetPool', assetPoolSchema);
