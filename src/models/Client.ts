import mongoose from 'mongoose';

export type ClientDocument = mongoose.Document & {
    _id: string;
    payload: {
        client_name: string;
        request_uris: string[];
        client_id: string;
        client_secret: string;
    };
};

const clientSchema = new mongoose.Schema(
    {
        _id: String,
        payload: {
            client_name: String,
            request_uris: [String],
            client_id: String,
            client_secret: String,
        },
    },
    { timestamps: false },
);

export const Client = mongoose.model<ClientDocument>('Client', clientSchema, 'client');
