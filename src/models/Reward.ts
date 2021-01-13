import mongoose from "mongoose";
export type RewardDocument = mongoose.Document & {
    id: number;
    title: string;
    description: string;
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
        title: String,
        description: String,
    },
    { timestamps: true },
);

export const Reward = mongoose.model<RewardDocument>("Reward", rewardSchema);
