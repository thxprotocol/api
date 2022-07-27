import mongoose from 'mongoose';
import { getContractFromAbi, getDiamondAbi } from '@/config/contracts';
import { TAssetPool } from '@/types/TAssetPool';

export type AssetPoolDocument = mongoose.Document & TAssetPool;

const assetPoolSchema = new mongoose.Schema(
    {
        address: String,
        chainId: Number,
        sub: String,
        clientId: String,
        transactions: [String],
        lastTransactionAt: Date,
        version: String,
        variant: String,
        archived: Boolean,
    },
    { timestamps: true },
);

assetPoolSchema.virtual('contract').get(function () {
    if (!this.address) return;
    return getContractFromAbi(this.chainId, getDiamondAbi(this.chainId, this.variant || 'defaultPool'), this.address);
});

export const AssetPool = mongoose.model<AssetPoolDocument>('AssetPool', assetPoolSchema);
