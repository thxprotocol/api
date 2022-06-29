import mongoose from 'mongoose';

export type MembershipDocument = mongoose.Document & {
    sub: string;
    poolId: string;
    erc20?: string;
    erc20Id?: string;
    erc721?: string;
    erc721Id?: string;
};

const membershipSchema = new mongoose.Schema(
    {
        sub: String,
        poolId: String,
        erc20Id: String,
        erc721Id: String,
    },
    { timestamps: true },
);

export const Membership = mongoose.model<MembershipDocument>('Membership', membershipSchema, 'membership');
