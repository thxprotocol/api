import { TERC721 } from '@/types/TERC721';
import mongoose from 'mongoose';

export type ERC721Document = mongoose.Document & TERC721;

const ERC721Schema = new mongoose.Schema(
    {
        network: Number,
        name: String,
        symbol: String,
        description: String,
        address: String,
    },
    { timestamps: true },
);

export const ERC721 = mongoose.model<ERC721Document>('ERC721', ERC721Schema, 'erc721');
