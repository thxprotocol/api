import { AccountPlanType, NetworkProvider } from '@/types/enums';
export interface IAccount {
    id?: string;
    address: string;
    privateKey: string;
    googleAccess: boolean;
    twitterAccess: boolean;
    youtube?: any;
    twitter?: any;
    spotify?: any;
    plan: AccountPlanType;
}
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
    privateKey?: string;
    authenticationToken?: string;
    authenticationTokenExpires?: number;
    googleAccess?: string;
    twitterAccess?: string;
    spotifyAccess?: string;
    plan?: AccountPlanType;
}
