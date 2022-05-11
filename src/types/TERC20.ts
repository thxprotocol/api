import { ERC20Type } from './enums';
import { Contract } from 'web3-eth-contract';

export type TERC20 = {
    _id?: string;
    name: string;
    symbol: string;
    address: string;
    totalSupply: number;
    decimals?: number;
    type: ERC20Type;
    logoURI: string;
    blockNumber?: number;
    transactionHash?: string;
    network?: number;
    sub?: string;
    contract?: Contract;
    adminBalance?: number;
    poolBalance?: number;
    getResponse?(): Promise<Omit<TERC20, 'getResponse'>>;
};
