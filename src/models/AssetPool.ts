import mongoose from 'mongoose';

export type AssetPoolDocument = mongoose.Document & {
    address: string;
    title: string;
    uid: string;
};

const assetPoolSchema = new mongoose.Schema(
    {
        address: String,
        title: String,
        uid: String,
    },
    { timestamps: true },
);
export const AssetPool = mongoose.model<AssetPoolDocument>('AssetPool', assetPoolSchema);
