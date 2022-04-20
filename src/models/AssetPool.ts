import mongoose from 'mongoose';
import { getContractFromAbi } from '@/util/network';
import { Contract } from 'web3-eth-contract';
import { getDiamondAbi } from '@/config/contracts';

export type AssetPoolType = {
    address: string;
    contract: Contract;
    network: number;
    sub: string;
    clientId: string;
    blockNumber: number;
    transactionHash: string;
    lastTransactionAt?: number;
    bypassPolls: boolean;
    version?: string;
    variant?: string;
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
        lastTransactionAt: Date,
        bypassPolls: Boolean,
        version: String,
        variant: String,
    },
    { timestamps: true },
);

assetPoolSchema.virtual('contract').get(function () {
    return getContractFromAbi(this.network, getDiamondAbi(this.network, this.variant || 'defaultPool'), this.address);
});

export const AssetPool = mongoose.model<AssetPoolDocument>('AssetPool', assetPoolSchema);
