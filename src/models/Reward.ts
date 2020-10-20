import mongoose from 'mongoose';
export type RewardDocument = mongoose.Document & {
    id: number;
    title: string;
    description: string;
    withdrawAmount: string;
    withdrawDuration: number;
    state: number;
    poll: {
        address: string;
        finalized: boolean;
        withdrawAmount: number;
        withdrawDuration: number;
    };
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
