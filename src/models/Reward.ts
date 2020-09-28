import mongoose from 'mongoose';
export type RewardDocument = mongoose.Document & {
    id: number;
    title: string;
    description: string;
    amount: string;
    state: number;
    poll: string;
    updated: string;
};

const rewardSchema = new mongoose.Schema(
    {
        id: Number,
        title: String,
        description: String,
    },
    { timestamps: true },
);
export const Reward = mongoose.model<RewardDocument>('Reward', rewardSchema);
