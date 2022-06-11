import { ERC20Type } from './enums';
import { Contract } from 'web3-eth-contract';

export type TERC20 = {
    type: ERC20Type;
    name: string;
    symbol: string;
    address: string;
    network?: number;
    contract?: Contract;
    sub?: string;
    totalSupply: number;
    decimals?: number;
    adminBalance?: number;
    poolBalance?: number; // TODO Should move to TAssetPool
};

export type TERC20Token = {
    sub?: string;
    erc20Id: string;
    balance?: number;
};
