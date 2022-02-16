import mongoose from 'mongoose';

export type RatDocument = mongoose.Document & {
    _id: string;
    payload: {
        jti: string;
        clientId: string;
    };
};

const ratSchema = new mongoose.Schema(
    {
        _id: String,
        payload: {
            jti: String,
            clientId: String,
        },
    },
    { timestamps: true },
);

export const Rat = mongoose.model<RatDocument>('Rat', ratSchema, 'registration_access_token');
