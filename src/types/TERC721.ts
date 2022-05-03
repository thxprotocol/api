import { Contract } from 'web3-eth-contract';

export enum ERC721MetadataState {
    Pending = 0,
    Failed = 1,
    Minted = 2,
}

type ERC721MetadataProp = {
    name: string;
    propType: string;
    description: string;
};

export type TERC721 = {
    id?: string;
    sub: string;
    network: number;
    name: string;
    symbol: string;
    properties: ERC721MetadataProp[];
    baseURL?: string;
    description?: string;
    contract?: Contract;
    address?: string;
    createdAt?: Date;
    updatedAt?: Date;
};

export type TERC721Metadata = {
    id?: string;
    erc721: string;
    state: ERC721MetadataState;
    tokenId: number;
    metadata: [{ key: string; value: string }];
    transactions: string[];
    beneficiary: string;
    createdAt: Date;
    updatedAt: Date;
};
