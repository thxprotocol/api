import { TClaim } from '@/types/TClaim';
import mongoose from 'mongoose';

export type ClaimDocument = mongoose.Document & TClaim;

const claimSchema = new mongoose.Schema(
    {
        poolId: String,
        erc20Id: String,
        erc721Id: String,
        rewardId: String,
    },
    { timestamps: true },
);

export const Claim = mongoose.model<ClaimDocument>('Claim', claimSchema);
