import { IAssetPool } from '../models/AssetPool';
import { ERC20Token, IAccountUpdates } from '../models/Account';
import { callFunction } from '../util/network';
import { authClient, getAuthAccessToken } from '../util/auth';
import { Membership } from '../models/Membership';
import { ERROR_IS_NOT_MEMBER } from './MemberService';

const ERROR_NO_ACCOUNT = 'Could not find an account for this address';

export default class AccountService {
    static async get(sub: string) {
        try {
            const r = await authClient({
                method: 'GET',
                url: `/account/${sub}`,
                headers: {
                    Authorization: await getAuthAccessToken(),
                },
            });

            return { account: r.data };
        } catch (error) {
            return { error };
        }
    }

    static async getByEmail(email: string) {
        try {
            const r = await authClient({
                method: 'GET',
                url: `/account/email/${email}`,
                headers: {
                    Authorization: await getAuthAccessToken(),
                },
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
            const r = await authClient({
                method: 'GET',
                url: `/account/address/${address}`,
                headers: {
                    Authorization: await getAuthAccessToken(),
                },
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
            await authClient({
                method: 'GET',
                url: `/account/email/${email}`, // TODO Should only return active accounts
                headers: {
                    Authorization: await getAuthAccessToken(),
                },
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
            const r = await authClient({
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
                headers: {
                    Authorization: await getAuthAccessToken(),
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
            const r = await authClient({
                method: 'DELETE',
                url: `/account/${sub}`,
                headers: {
                    Authorization: await getAuthAccessToken(),
                },
            });

            if (!r.data) {
                throw new Error('Could not delete');
            }

            return { result: true };
        } catch (error) {
            return { error };
        }
    }

    static async signupFor(email: string, password: string, poolAddress: string, address?: string) {
        try {
            const r = await authClient({
                method: 'POST',
                url: '/account',
                data: {
                    email,
                    password,
                    address,
                    poolAddress,
                },
                headers: {
                    Authorization: await getAuthAccessToken(),
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

    static async checkAssetPoolAccess(sub: string, poolAddress: string) {
        try {
            const membership = await Membership.findOne({
                sub,
                poolAddress,
            });

            if (!membership) {
                throw new Error(ERROR_IS_NOT_MEMBER);
            }

            return { result: true };
        } catch (error) {
            return { error };
        }
    }

    static async addMembership(sub: string, assetPool: IAssetPool, tokenAddress?: string) {
        try {
            const membership = await Membership.findOne({
                sub,
                network: assetPool.network,
                poolAddress: assetPool.address,
                tokenAddress: tokenAddress
                    ? tokenAddress
                    : await callFunction(assetPool.solution.methods.getToken(), assetPool.network),
            });

            if (!membership) {
                const membership = new Membership({
                    sub,
                    network: assetPool.network,
                    poolAddress: assetPool.address,
                    tokenAddress,
                });

                await membership.save();
            }

            return { result: true };
        } catch (error) {
            return { error };
        }
    }

    static async removeMembership(sub: string, assetPool: IAssetPool) {
        try {
            const tokenAddress = await callFunction(assetPool.solution.methods.getToken(), assetPool.network);
            const membership = await Membership.findOne({
                sub,
                network: assetPool.network,
                poolAddress: assetPool.address,
                tokenAddress,
            });

            await membership.remove();

            return { result: true };
        } catch (error) {
            return { error };
        }
    }
}
