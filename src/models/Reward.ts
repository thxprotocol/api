import mongoose from 'mongoose';

export type RewardDocument = mongoose.Document & {
    id: number;
    amount: number;
    beneficiary: string;
};

const rewardSchema = new mongoose.Schema(
    {
        id: Number,
        amount: Number,
        beneficiary: String,
    },
    { timestamps: true },
);
export const Reward = mongoose.model<RewardDocument>('Reward', rewardSchema);
