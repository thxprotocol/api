import mongoose from 'mongoose';

export type ClientDocument = mongoose.Document & {
    sub: string;
    clientId: string;
    clientSecret: string;
    requestUris: string[];
    registrationAccessToken: string;
};

const clientSchema = new mongoose.Schema(
    {
        sub: String,
        clientId: String,
        registrationAccessToken: String,
    },
    { timestamps: false },
);

export const Client = mongoose.model<ClientDocument>('Client', clientSchema, 'client');
