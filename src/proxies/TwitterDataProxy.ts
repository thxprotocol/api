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
            console.log(r.data);
            if (r.status !== 200) throw new Error(ERROR_NO_TWITTER);
            if (!r.data) throw new Error(ERROR_NO_TWITTER);

            return { isAuthorized: r.data.isAuthorized, tweets: r.data.tweets };
        } catch (error) {
            return { error };
        }
    }
}
