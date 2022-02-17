import { IAccount } from '@/models/Account';
import { authClient, getAuthAccessToken } from '@/util/auth';
const ERROR_NO_YOUTUBE = 'Could not find youtube data for this account';

export default class YoutubeDataProxy {
    static async getYoutube(sub: string) {
        try {
            const r = await authClient({
                method: 'GET',
                url: `/account/${sub}/youtube`,
                headers: {
                    Authorization: await getAuthAccessToken(),
                },
            });

            if (!r.data) throw new Error(ERROR_NO_YOUTUBE);

            return { isAuthorized: r.data.isAuthorized, channels: r.data.channels, videos: r.data.videos };
        } catch (error) {
            return { error };
        }
    }

    static async validateLike(account: IAccount, channelItem: string) {
        try {
            const r = await authClient({
                method: 'GET',
                url: `/account/${account.id}/youtube/like/${channelItem}`,
                headers: {
                    Authorization: await getAuthAccessToken(),
                },
            });

            if (!r.data) throw new Error(ERROR_NO_YOUTUBE);

            return { result: r.data.result };
        } catch (error) {
            return { error };
        }
    }

    static async validateSubscribe(account: IAccount, channelItem: string) {
        try {
            const r = await authClient({
                method: 'GET',
                url: `/account/${account.id}/youtube/subscribe/${channelItem}`,
                headers: {
                    Authorization: await getAuthAccessToken(),
                },
            });

            if (!r.data) throw new Error(ERROR_NO_YOUTUBE);

            return { result: r.data.result };
        } catch (error) {
            return { error };
        }
    }
}
