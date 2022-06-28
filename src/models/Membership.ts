import mongoose from 'mongoose';
import { ChainId } from '@/types/enums';

export type MembershipDocument = mongoose.Document & {
    sub: string;
    chainId: ChainId;
    poolId: string;
    poolAddress: string;
    poolBalance: number;
    erc20?: string;
    erc721?: string;
    erc20Id?: string;
    erc721Id?: string;
};

const membershipSchema = new mongoose.Schema(
    {
        sub: String,
        chainId: Number, // Should be deprecated and infered from poolID
        erc20: String,
        erc721: String,
        erc20Id: String,
        erc721Id: String,
        poolId: String,
        poolAddress: String, // Should be deprecated and infered from poolID
    },
    { timestamps: true },
);

export const Membership = mongoose.model<MembershipDocument>('Membership', membershipSchema, 'membership');
