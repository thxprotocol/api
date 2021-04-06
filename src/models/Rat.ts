import mongoose from 'mongoose';

export type RatDocument = mongoose.Document & {
    _id: string;
    payload: object;
};

const ratSchema = new mongoose.Schema(
    {
        _id: String,
        payload: Object,
    },
    { timestamps: false },
);

export const Rat = mongoose.model<RatDocument>('Rat', ratSchema, 'registration_access_token');
