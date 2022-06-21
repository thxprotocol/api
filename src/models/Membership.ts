import mongoose from 'mongoose';
import { ChainId } from '@/types/enums';

export type MembershipDocument = mongoose.Document & {
    sub: string;
    chainId: ChainId;
    poolAddress: string;
    poolBalance: number;
    erc20?: string;
    erc721?: string;
};

const membershipSchema = new mongoose.Schema(
    {
        sub: String,
        chainId: Number,
        erc20: String,
        erc721: String,
        poolAddress: String,
    },
    { timestamps: true },
);

export const Membership = mongoose.model<MembershipDocument>('Membership', membershipSchema, 'membership');
