import { NetworkProvider } from '../enums';

export interface ICreateERC20Params {
    name: string;
    symbol: string;
    totalSupply: string;
    network: NetworkProvider;
    sub: string;
}
