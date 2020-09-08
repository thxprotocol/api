import mongoose from 'mongoose';

export type RewardPoolDocument = mongoose.Document & {
    address: string;
    title: string;
    uid: string;
    rewardRuleCount: number;
    rewardCount: number;
};

const rewardPoolSchema = new mongoose.Schema(
    {
        address: String,
        title: String,
        uid: String,
    },
    { timestamps: true },
);
export const RewardPool = mongoose.model<RewardPoolDocument>('RewardPool', rewardPoolSchema);
