import { ERC20Type } from './enums';
import { Contract } from 'web3-eth-contract';

export type TERC20 = {
    name: string;
    symbol: string;
    address: string;
    totalSupply: number;
    type: ERC20Type;
    logoURI: string;
    blockNumber?: number;
    transactionHash?: string;
    network?: number;
    sub?: string;
    contract?: Contract;
    getResponse?(): Promise<Omit<TERC20, 'getResponse'>>;
};
