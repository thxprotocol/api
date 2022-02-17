import mongoose from 'mongoose';
import { NetworkProvider } from '@/util/network';

export type MembershipDocument = mongoose.Document & {
    sub: string;
    network: NetworkProvider;
    poolAddress: string;
};

const membershipSchema = new mongoose.Schema(
    {
        sub: String,
        network: Number,
        poolAddress: String,
    },
    { timestamps: true },
);

export const Membership = mongoose.model<MembershipDocument>('Membership', membershipSchema, 'membership');
