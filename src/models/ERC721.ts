import mongoose from 'mongoose';
import { TERC721, TERC721Metadata } from '@/types/TERC721';
import { tokenContract } from '@/util/network';

export type ERC721Document = mongoose.Document & TERC721;

const ERC721Schema = new mongoose.Schema(
    {
        network: Number,
        name: String,
        symbol: String,
        description: String,
        address: String,
        baseURL: String,
        schema: [String],
    },
    { timestamps: true },
);

export type ERC721MetadataDocument = mongoose.Document & TERC721Metadata;

const ERC721MetadataSchema = new mongoose.Schema(
    {
        erc721: String,
        tokenId: Number,
        metadata: [{ key: String, value: String }],
    },
    { timestamps: true },
);

ERC721Schema.virtual('contract').get(function () {
    return tokenContract(this.network, 'NonFungibleToken', this.address);
});

export const ERC721 = mongoose.model<ERC721Document>('ERC721', ERC721Schema, 'erc721');
export const ERC721Metadata = mongoose.model<ERC721MetadataDocument>(
    'ERC721Metadata',
    ERC721MetadataSchema,
    'erc721metadata',
);
