import { authClient, getAuthAccessToken } from '../util/auth';

const NO_USER = 'Could not find spotify data for this account';

export default class SpotifyDataProxy {
    static async getSpotify(sub: string) {
        try {
            const r = await authClient({
                method: 'GET',
                url: `/account/${sub}/spotify`,
                headers: {
                    Authorization: await getAuthAccessToken(),
                },
            });

            if (r.status !== 200) throw new Error(NO_USER);
            if (!r.data) throw new Error(NO_USER);

            return { ...r.data };
        } catch (error) {
            return { error };
        }
    }
}
