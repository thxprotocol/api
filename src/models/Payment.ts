import mongoose from 'mongoose';
import { PaymentState } from '@/types/enums/PaymentState';
import PaymentService from '@/services/PaymentService';

export type TPayment = {
    amount: string;
    token: string;
    tokenAddress: string;
    poolId: string;
    chainId: number;
    sender: string;
    receiver: string;
    transactions: string[];
    state: PaymentState;
    paymentUrl: string;
    returnUrl: string;
    createdAt: Date;
    updatedAt?: Date;
};

export type PaymentDocument = mongoose.Document & TPayment;

const paymentSchema = new mongoose.Schema(
    {
        amount: String,
        token: String,
        tokenAddress: String,
        chainId: Number,
        sender: String,
        receiver: String,
        transactions: [String],
        item: String,
        state: Number,
        returnUrl: String,
    },
    { timestamps: true },
);

paymentSchema.virtual('paymentUrl').get(function () {
    return PaymentService.getPaymentUrl(this._id, this.token);
});

export const Payment = mongoose.model<PaymentDocument>('Payment', paymentSchema, 'payments');
