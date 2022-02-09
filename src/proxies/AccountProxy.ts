import { IAccount, IAccountUpdates } from '../models/Account';
import { authClient, getAuthAccessToken } from '../util/auth';

const ERROR_NO_ACCOUNT = 'Could not find an account for this address';

export default class AccountProxy {
    static async getById(sub: string) {
        try {
            const r = await authClient({
                method: 'GET',
                url: `/account/${sub}`,
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

    static async getByAddress(address: string): Promise<{ account?: IAccount; error?: Error }> {
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

            return { isDuplicate: true };
        } catch (error) {
            if (error.status !== 404) {
                return { error };
            }
            return { isDuplicate: false };
        }
    }

    static async update(
        sub: string,
        {
            address,
            privateKey,
            gasAdmin,
            acceptTermsPrivacy,
            acceptUpdates,
            authenticationToken,
            authenticationTokenExpires,
            googleAccess,
            twitterAccess,
        }: IAccountUpdates,
    ) {
        try {
            const r = await authClient({
                method: 'PATCH',
                url: `/account/${sub}`,
                data: {
                    address,
                    gasAdmin,
                    privateKey,
                    acceptTermsPrivacy,
                    acceptUpdates,
                    authenticationToken,
                    authenticationTokenExpires,
                    googleAccess,
                    twitterAccess,
                },
                headers: {
                    Authorization: await getAuthAccessToken(),
                },
            });

            if (r.status !== 204) {
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

    static async signupFor(email: string, password: string, address?: string) {
        try {
            const r = await authClient({
                method: 'POST',
                url: '/account',
                data: {
                    email,
                    password,
                    address,
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
}
