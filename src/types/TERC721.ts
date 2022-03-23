import { Contract } from 'web3-eth-contract';

export type TERC721 = {
    id?: string;
    network: number;
    name: string;
    symbol: string;
    description?: string;
    contract?: Contract;
    address?: string;
};
