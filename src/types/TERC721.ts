import { Contract } from 'web3-eth-contract';

export type TERC721 = {
    id?: string;
    network: number;
    name: string;
    symbol: string;
    schema: string[];
    baseURL?: string;
    description?: string;
    contract?: Contract;
    address?: string;
    createdAt?: Date;
    updatedAt?: Date;
};

export type TERC721Metadata = {
    id?: string;
    tokenId: number;
    metadata: [{ key: string; value: string }];
    createdAt: Date;
    updatedAt: Date;
};
