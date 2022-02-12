import mongoose from 'mongoose';

export type PromoCodeDocument = mongoose.Document & {
    value: string;
    expiry: Date;
};

const PromoCodeSchema = new mongoose.Schema(
    {
        value: String,
        expiry: Date,
    },
    { timestamps: false },
);

export const PromoCode = mongoose.model<PromoCodeDocument>('PromoCode', PromoCodeSchema, 'promocodes');
