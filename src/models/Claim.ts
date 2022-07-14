import { ClaimDocument } from '@/types/TClaim';
import mongoose from 'mongoose';

const schema = new mongoose.Schema(
    {
        poolId: String,
        erc20Id: String,
        erc721Id: String,
        rewardId: String,
    },
    { timestamps: true },
);

export const Claim = mongoose.model<ClaimDocument>('Claim', schema, 'claims');
