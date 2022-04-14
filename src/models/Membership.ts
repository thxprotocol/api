import mongoose from 'mongoose';
import { NetworkProvider } from '@/types/enums';

export type MembershipDocument = mongoose.Document & {
    sub: string;
    network: NetworkProvider;
    poolAddress: string;
    poolBalance: number;
    erc20: string;
};

const membershipSchema = new mongoose.Schema(
    {
        sub: String,
        network: Number,
        erc20: String,
        poolAddress: String,
    },
    { timestamps: true },
);

export const Membership = mongoose.model<MembershipDocument>('Membership', membershipSchema, 'membership');
