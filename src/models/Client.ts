import mongoose from 'mongoose';

export type ClientDocument = mongoose.Document & {
    sub: string;
    poolId: string;
    clientId: string;
    clientSecret: string;
    requestUris: string[];
    registrationAccessToken: string;
};

const clientSchema = new mongoose.Schema(
    {
        sub: String,
        poolId: String,
        clientId: String,
        registrationAccessToken: String,
    },
    { timestamps: true },
);

export const Client = mongoose.model<ClientDocument>('Client', clientSchema, 'client');
