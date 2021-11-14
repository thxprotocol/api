import { NetworkProvider } from '../util/network';

export interface ERC20Token {
    network: NetworkProvider;
    address: string;
}

export interface AuthToken {
    accessToken: string;
    kind: string;
}

export interface IAccountUpdates {
    acceptTermsPrivacy?: boolean;
    acceptUpdates?: boolean;
    address?: string;
    memberships?: string[];
    privateKey?: string;
    burnProofs?: string[];
    registrationAccessTokens?: string[];
    erc20?: ERC20Token[];
    authenticationToken?: string;
    authenticationTokenExpires?: number;
}
