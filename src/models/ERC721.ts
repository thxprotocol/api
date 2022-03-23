import { TERC721 } from '@/types/TERC721';
import mongoose from 'mongoose';
import { getContractFromAbi } from '@/util/network';
import ERC721Artifact from '@openzeppelin/contracts/build/contracts/ERC721.json';
import { AbiItem } from 'web3-utils';

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

ERC721Schema.virtual('contract').get(function () {
    return getContractFromAbi(this.network, ERC721Artifact.abi as AbiItem[], this.address);
});

export const ERC721 = mongoose.model<ERC721Document>('ERC721', ERC721Schema, 'erc721');
