import mongoose from 'mongoose';

export type IMember = mongoose.Document & {
    poolAddress: string;
    memberId: number;
    address: string;
};

const memberSchema = new mongoose.Schema(
    {
        poolAddress: String,
        memberId: Number,
        address: String,
    },
    { timestamps: false },
);

export const Member = mongoose.model<IMember>('Member', memberSchema, 'member');
