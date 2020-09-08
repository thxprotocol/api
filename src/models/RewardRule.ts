import mongoose from 'mongoose';
export type RewardRuleDocument = mongoose.Document & {
    id: number;
    title: string;
    description: string;
    amount: string;
    state: number;
    poll: string;
    updated: string;
};

const rewardRuleSchema = new mongoose.Schema(
    {
        id: Number,
        title: String,
        description: String,
    },
    { timestamps: true },
);
export const RewardRule = mongoose.model<RewardRuleDocument>('RewardRule', rewardRuleSchema);
