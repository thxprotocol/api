import mongoose from "mongoose";

export enum WithdrawState {
    Pending = 0,
    Approved = 1,
    Rejected = 2,
    Withdrawn = 3,
}

export type WithdrawDocument = mongoose.Document & {
    id: number;
    amount: number;
    beneficiary: string;
};

const withdrawSchema = new mongoose.Schema(
    {
        id: Number,
        amount: Number,
        beneficiary: String,
    },
    { timestamps: true },
);
export const Withdraw = mongoose.model<WithdrawDocument>("Withdraw", withdrawSchema);
