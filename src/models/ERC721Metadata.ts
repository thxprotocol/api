import mongoose from 'mongoose';
import { TERC721Metadata } from '@/types/TERC721';

export type ERC721MetadataDocument = mongoose.Document & TERC721Metadata;

const ERC721MetadataSchema = new mongoose.Schema(
    {
        erc721: String,
        tokenId: Number,
        beneficiary: String,
        metadata: [{ key: String, value: String }],
    },
    { timestamps: true },
);
export const ERC721Metadata = mongoose.model<ERC721MetadataDocument>(
    'ERC721Metadata',
    ERC721MetadataSchema,
    'erc721metadata',
);
