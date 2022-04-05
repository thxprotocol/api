import { NetworkProvider } from '../enums';

export interface ICreateERC20Params {
    name: string;
    symbol: string;
    totalSupply: string;
    network: NetworkProvider;
    sub: string;
}

export interface CreateERC20Params {
    name: string;
    symbol: string;
    totalSupply: string;
    network: NetworkProvider;
    sub: string;
}

export interface TransferERC20MintedParams {
    id: string;
    to: string;
    npid: NetworkProvider;
}

export interface AddTokenToPoolParams {
    sub: string;
    tokenId: string;
    poolId: string;
    npid: NetworkProvider;
}
