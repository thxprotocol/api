import { IAccount } from '../models/Account';
import { authClient, getAuthAccessToken } from '../util/auth';

const ERROR_NO_TWITTER = 'Could not find twitter data for this account';

export default class TwitterDataProxy {
    static async getTwitter(sub: string) {
        try {
            const r = await authClient({
                method: 'GET',
                url: `/account/${sub}/twitter`,
                headers: {
                    Authorization: await getAuthAccessToken(),
                },
            });

            if (r.status !== 200) throw new Error(ERROR_NO_TWITTER);
            if (!r.data) throw new Error(ERROR_NO_TWITTER);

            return { isAuthorized: r.data.isAuthorized, tweets: r.data.tweets, users: r.data.users };
        } catch (error) {
            return { error };
        }
    }

    static async validateLike(account: IAccount, channelItem: string) {
        try {
            const r = await authClient({
                method: 'GET',
                url: `/account/${account.id}/twitter/like/${channelItem}`,
                headers: {
                    Authorization: await getAuthAccessToken(),
                },
            });

            if (!r.data) throw new Error(ERROR_NO_TWITTER);

            return { result: r.data.result };
        } catch (error) {
            return { error };
        }
    }

    static async validateRetweet(account: IAccount, channelItem: string) {
        try {
            const r = await authClient({
                method: 'GET',
                url: `/account/${account.id}/twitter/retweet/${channelItem}`,
                headers: {
                    Authorization: await getAuthAccessToken(),
                },
            });

            if (!r.data) throw new Error(ERROR_NO_TWITTER);

            return { result: r.data.result };
        } catch (error) {
            return { error };
        }
    }

    static async validateFollow(account: IAccount, channelItem: string) {
        try {
            const r = await authClient({
                method: 'GET',
                url: `/account/${account.id}/twitter/follow/${channelItem}`,
                headers: {
                    Authorization: await getAuthAccessToken(),
                },
            });

            if (!r.data) throw new Error(ERROR_NO_TWITTER);

            return { result: r.data.result };
        } catch (error) {
            return { error };
        }
    }
}
