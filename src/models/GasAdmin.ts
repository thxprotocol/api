import mongoose from 'mongoose';
import { GastAdminType } from '@/enums/GasAdminType';
import { TGasAdmin } from '@/types/GasAdmin';

export type GasAdminDocument = mongoose.Document & TGasAdmin;

const GasAdminSchema = new mongoose.Schema(
    {
        type: GastAdminType,
        nonce: Number,
        address: String,
        privateKey: String,
    },
    { timestamps: true },
);

export const GasAdmin = mongoose.model<GasAdminDocument>('GasAdmin', GasAdminSchema, 'gas_admins');
