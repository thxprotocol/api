import mongoose from 'mongoose';

export type AssetPoolDocument = mongoose.Document & {
    address: string;
    title: string;
    client: string;
    blockNumber: number;
    transactionHash: string;
};

const assetPoolSchema = new mongoose.Schema(
    {
        address: String,
        title: String,
        client: String,
        blockNumber: Number,
        transactionHash: String,
    },
    { timestamps: true },
);
export const AssetPool = mongoose.model<AssetPoolDocument>('AssetPool', assetPoolSchema);
