import { TTransactionalEmail } from '@/types/TTransactionalEmail';
import mongoose from 'mongoose';

export type TransactionalEmailDocument = mongoose.Document & TTransactionalEmail;

const transactionalEmailSchema = new mongoose.Schema(
    {
        type: String,
        sub: String,
    },
    { timestamps: true },
);

export const Transaction = mongoose.model<TransactionalEmailDocument>('TransactionalEmail', transactionalEmailSchema);
