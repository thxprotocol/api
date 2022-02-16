import mongoose from 'mongoose';
import { PromoCodeType } from '@/types/PromoCode';

export type PromoCodeDocument = mongoose.Document & PromoCodeType;

const PromoCodeSchema = new mongoose.Schema(
    {
        sub: String,
        price: Number,
        value: String,
        expiry: Date,
    },
    { timestamps: true },
);

export const PromoCode = mongoose.model<PromoCodeDocument>('PromoCode', PromoCodeSchema, 'promocodes');
