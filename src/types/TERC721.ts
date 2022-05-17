import { Contract } from 'web3-eth-contract';

export enum ERC721TokenState {
    Pending = 0,
    Failed = 1,
    Minted = 2,
}

type TERC721Attribute = {
    key: string;
    value: string;
};

type TERC721MetadataProp = {
    name: string;
    propType: string;
    description: string;
};

export type TERC721Token = {
    id?: string;
    sub: string;
    state: ERC721TokenState;
    recipient: string;
    transactions: string[];
    tokenId: number;
    erc721Id: string;
    metadataId: string;
    metadata?: TERC721Metadata;
};

export type TERC721 = {
    id?: string;
    sub: string;
    network: number;
    name: string;
    symbol: string;
    properties: TERC721MetadataProp[];
    baseURL?: string;
    description?: string;
    contract?: Contract;
    address?: string;
    createdAt?: Date;
    updatedAt?: Date;
};

export type TERC721Metadata = {
    erc721: string;
    title: string;
    description: string;
    attributes: TERC721Attribute[];
    tokens?: TERC721Token[];
    createdAt: Date;
    updatedAt: Date;
};
