import mongoose from 'mongoose';

export type ClientDocument = mongoose.Document & {
    _id: string;
    payload: object;
};

const clientSchema = new mongoose.Schema(
    {
        _id: String,
        payload: Object,
    },
    { timestamps: false },
);

export const Client = mongoose.model<ClientDocument>('Client', clientSchema, 'client');
