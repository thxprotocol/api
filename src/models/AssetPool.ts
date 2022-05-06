import mongoose from 'mongoose';
import { getContractFromAbi } from '@/util/network';
import { getDiamondAbi } from '@/config/contracts';
import { TAssetPool } from '@/types/TAssetPool';

export type AssetPoolDocument = mongoose.Document & TAssetPool;

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
