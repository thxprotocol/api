import axios from 'axios';
import { AUTH_CLIENT_ID, AUTH_CLIENT_SECRET, AUTH_URL } from '../util/secrets';

export async function getAuthAccessToken() {
    try {
        const basicAuthHeader = 'Basic ' + Buffer.from(`${AUTH_CLIENT_ID}:${AUTH_CLIENT_SECRET}`).toString('base64');
        const { data } = await axios({
            url: '/token',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': basicAuthHeader,
            },
            data: {
                grant_type: 'client_credentials',
                scope: 'openid account:read account:write',
            },
        });

        return `Bearer ${data.access_token}`;
    } catch (error) {
        return { error };
    }
}

axios.defaults.baseURL = AUTH_URL;

export const authClient = axios;
