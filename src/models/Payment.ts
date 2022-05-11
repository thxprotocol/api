import mongoose from 'mongoose';
import { WALLET_URL } from '@/config/secrets';

export type TPayment = {
    id: string;
    amount: string;
    token: string;
    network: number;
    chainId: string;
    sender: string;
    receiver: string;
    state: number;
    redirectUrl: string;
    createdAt: Date;
    updatedAt?: Date;
};

export type PaymentDocument = mongoose.Document & TPayment;

const paymentSchema = new mongoose.Schema(
    {
        amount: String,
        token: String,
        chainId: String,
        network: Number,
        sender: String,
        receiver: String,
        item: String,
        state: Number,
    },
    { timestamps: true },
);

paymentSchema.virtual('redirectUrl').get(function () {
    return `${WALLET_URL}/payment/${String(this._id)}`;
});

export const Payment = mongoose.model<PaymentDocument>('Payment', paymentSchema, 'payments');
