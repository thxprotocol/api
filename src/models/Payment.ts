import mongoose from 'mongoose';
import { PaymentState } from '@/types/enums/PaymentState';
import PaymentService from '@/services/PaymentService';

export type TPayment = {
    amount: string;
    token: string; // TODO Shouldnt this be a ref to a pool?
    poolId: string;
    network: number;
    chainId: number;
    sender: string;
    receiver: string;
    transactions: string[];
    state: PaymentState;
    redirectUrl: string;
    returnUrl: string;
    createdAt: Date;
    updatedAt?: Date;
};

export type PaymentDocument = mongoose.Document & TPayment;

const paymentSchema = new mongoose.Schema(
    {
        amount: String,
        token: String,
        chainId: Number,
        network: Number,
        sender: String,
        receiver: String,
        transactions: [String],
        item: String,
        state: Number,
        returnUrl: String,
    },
    { timestamps: true },
);

paymentSchema.virtual('redirectUrl').get(function () {
    return PaymentService.getPaymentUrl(this._id);
});

export const Payment = mongoose.model<PaymentDocument>('Payment', paymentSchema, 'payments');
