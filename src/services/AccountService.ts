import { IAssetPool } from '../models/AssetPool';
import { ERC20Token, IAccountUpdates } from '../models/Account';
import { callFunction } from '../util/network';
import { AUTH_URL } from '../util/secrets';
import Web3 from 'web3';
import axios from 'axios';
import ClientService from './ClientService';

const ERROR_NO_ACCOUNT = 'Could not find an account for this address';
const apiAccesstoken = '';

axios.defaults.baseURL = AUTH_URL;
axios.interceptors.request.use(
    (config) => {
        config.headers.Authorization = `Bearer ${apiAccesstoken}`;
        // Do something before request is sent
        return config;
    },
    function (error) {
        // Do something with request error
        return Promise.reject(error);
    },
);

export default class AccountService {
    static async get(sub: string) {
        try {
            const r = await axios({
                method: 'GET',
                url: `/account/${sub}`,
            });

            return { account: r.data };
        } catch (error) {
            return { error };
        }
    }

    static async getByEmail(email: string) {
        try {
            const r = await axios({
                method: 'GET',
                url: `/account/email/${email}`,
            });

            if (!r.data) {
                throw new Error(ERROR_NO_ACCOUNT);
            }

            return { account: r.data };
        } catch (error) {
            return { error };
        }
    }

    static async getByAddress(address: string) {
        try {
            const r = await axios({
                method: 'GET',
                url: `/account/address/${address}`,
            });

            if (!r.data) {
                throw new Error(ERROR_NO_ACCOUNT);
            }

            return { account: r.data };
        } catch (error) {
            return { error };
        }
    }

    static async isEmailDuplicate(email: string) {
        try {
            await axios({
                method: 'GET',
                url: `/account/email/${email}`,
            });

            return { result: true };
        } catch (error) {
            if (error.status !== 404) {
                return { error };
            }
            return { result: true };
        }
    }

    static async update(
        sub: string,
        {
            acceptTermsPrivacy,
            acceptUpdates,
            address,
            memberships,
            privateKey,
            burnProofs,
            registrationAccessTokens,
            erc20,
            authenticationToken,
            authenticationTokenExpires,
        }: IAccountUpdates,
    ) {
        try {
            const r = await axios({
                method: 'PATCH',
                url: `/account/${sub}`,
                data: {
                    acceptTermsPrivacy,
                    acceptUpdates,
                    address,
                    memberships,
                    privateKey,
                    burnProofs,
                    registrationAccessTokens,
                    erc20,
                    authenticationToken,
                    authenticationTokenExpires,
                },
            });

            if (!r.data) {
                throw new Error('Could not update');
            }

            return { result: true };
        } catch (error) {
            return { error };
        }
    }

    static async remove(sub: string) {
        try {
            const r = await axios({
                method: 'DELETE',
                url: `/account/${sub}`,
            });

            if (!r.data) {
                throw new Error('Could not delete');
            }

            return { result: true };
        } catch (error) {
            return { error };
        }
    }

    static async signupFor(email: string, password: string, address: string, poolAddress: string) {
        try {
            const wallet = new Web3().eth.accounts.create();
            const privateKey = address ? null : wallet.privateKey;

            const r = await axios({
                method: 'POST',
                url: '/account',
                data: {
                    active: true,
                    address: address ? address : wallet.address,
                    privateKey: address ? privateKey : wallet.privateKey,
                    email,
                    password,
                    memberships: poolAddress ? [poolAddress] : [],
                },
            });

            if (!r.data) {
                throw new Error('Could not update');
            }

            return { account: r.data };
        } catch (error) {
            return { error };
        }
    }

    static async addRatForAddress(address: string) {
        try {
            const { account, error } = await this.getByAddress(address);

            if (error) return { error };

            const { client } = await ClientService.create();

            const rat = client.registration_access_token;

            if (account.registrationAccessTokens.length) {
                if (!account.registrationAccessTokens.includes(rat)) {
                    account.registrationAccessTokens.push(rat);
                }
            } else {
                account.registrationAccessTokens = [rat];
            }

            await this.update(account.sub, { registrationAccessTokens: account.registrationAccessTokens });

            return { rat };
        } catch (error) {
            return { error };
        }
    }

    static async addMembershipForAddress(assetPool: IAssetPool, address: string) {
        try {
            const { account, error } = await this.getByAddress(address);

            if (error) throw new Error(error);

            if (!account.memberships.includes(assetPool.address)) {
                account.memberships.push(assetPool.address);
            }

            const tokenAddress = await callFunction(assetPool.solution.methods.getToken(), assetPool.network);
            const hasERC20 = account.erc20.find((erc20: ERC20Token) => erc20.address === tokenAddress);

            if (!hasERC20) {
                account.erc20.push({ address: tokenAddress, network: assetPool.network });
            }

            await this.update(account.sub, {
                registrationAccessTokens: account.registrationAccessTokens,
                memberships: account.memberships,
                erc20: account.erc20,
            });

            return { result: true };
        } catch (error) {
            return { error };
        }
    }

    static async removeMembershipForAddress(assetPool: IAssetPool, address: string) {
        try {
            const { account, error } = await this.getByAddress(address);

            if (error) throw new Error(error);

            if (account && account.memberships) {
                const index = account.memberships.indexOf(assetPool.solution.options.address);

                if (index > -1) {
                    account.memberships.splice(index, 1);
                }
            }

            await this.update(account.sub, {
                memberships: account.memberships,
            });

            return { result: true };
        } catch (error) {
            return { error };
        }
    }
}
