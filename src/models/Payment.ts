import mongoose from 'mongoose';
import { PaymentType } from '../types/Payment';

export type PaymentDocument = mongoose.Document & PaymentType;

const PaymentSchema = new mongoose.Schema(
    {
        sub: String,
        amount: Number,
        sender: String,
        receiver: String,
        item: String,
        state: Number,
    },
    { timestamps: false },
);

export const Payment = mongoose.model<PaymentDocument>('Payment', PaymentSchema, 'payments');
