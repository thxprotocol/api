import mongoose from 'mongoose';
import { TERC721 } from '@/types/TERC721';
import { getAbiForContractName } from '@/config/contracts';
import { getProvider } from '@/util/network';

export type ERC721Document = mongoose.Document & TERC721;

const ERC721Schema = new mongoose.Schema(
    {
        chainId: Number,
        sub: String,
        name: String,
        symbol: String,
        description: String,
        transactions: [String],
        address: String,
        baseURL: String,
        properties: [{ name: String, propType: String, description: String }],
        archived: Boolean,
    },
    { timestamps: true },
);

ERC721Schema.virtual('contract').get(function () {
    if (!this.address) return;
    const { readProvider, defaultAccount } = getProvider(this.chainId);
    const abi = getAbiForContractName('NonFungibleToken');
    return new readProvider.eth.Contract(abi, this.address, { from: defaultAccount });
});

export interface IERC721Updates {
    archived?: boolean;
}

export const ERC721 = mongoose.model<ERC721Document>('ERC721', ERC721Schema, 'erc721');
