import mongoose from 'mongoose';
export type RewardDocument = mongoose.Document & {
    id: number;
    withdrawAmount: number;
    withdrawDuration: number;
    state: number;
    pollId: number;
    poll: {
        pollId: number;
        finalized: boolean;
        withdrawAmount: number;
        withdrawDuration: number;
    } | null;
    updated: string;
};

const rewardSchema = new mongoose.Schema(
    {
        id: Number,
    },
    { timestamps: true },
);

export const Reward = mongoose.model<RewardDocument>('Reward', rewardSchema);
