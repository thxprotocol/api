import mongoose from 'mongoose';

export type AssetPoolDocument = mongoose.Document & {
    address: string;
    network: number;
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
        network: Number,
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
