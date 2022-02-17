import mongoose from 'mongoose';
import { TPromoCode } from '@/types/TPromoCode';

export type PromoCodeDocument = mongoose.Document & TPromoCode;

const PromoCodeSchema = new mongoose.Schema(
    {
        sub: String,
        title: String,
        description: String,
        value: String,
        price: Number,
        poolAddress: String,
    },
    { timestamps: true },
);

export const PromoCode = mongoose.model<PromoCodeDocument>('PromoCode', PromoCodeSchema, 'promocodes');
