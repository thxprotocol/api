import mongoose from 'mongoose';
import { TERC721 } from '@/types/TERC721';
import { getContractFromName } from '@/config/contracts';

export type ERC721Document = mongoose.Document & TERC721;

const ERC721Schema = new mongoose.Schema(
    {
        network: Number,
        sub: String,
        name: String,
        symbol: String,
        description: String,
        address: String,
        baseURL: String,
        properties: [{ name: String, propType: String, description: String }],
    },
    { timestamps: true },
);

ERC721Schema.virtual('contract').get(function () {
    return getContractFromName(this.network, 'NonFungibleToken', this.address);
});

export const ERC721 = mongoose.model<ERC721Document>('ERC721', ERC721Schema, 'erc721');
