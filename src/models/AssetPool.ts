import mongoose from 'mongoose';

export type AssetPoolDocument = mongoose.Document & {
    address: string;
    title: string;
    aud: string;
    sub: string;
    blockNumber: number;
    transactionHash: string;
    bypassPolls: boolean;
};

const assetPoolSchema = new mongoose.Schema(
    {
        address: String,
        title: String,
        aud: String,
        sub: String,
        blockNumber: Number,
        transactionHash: String,
        bypassPolls: Boolean,
    },
    { timestamps: true },
);
export const AssetPool = mongoose.model<AssetPoolDocument>('AssetPool', assetPoolSchema);
