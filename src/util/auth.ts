import axios from 'axios';
import { AUTH_CLIENT_ID, AUTH_CLIENT_SECRET, AUTH_URL } from '../util/secrets';

axios.defaults.baseURL = AUTH_URL;

export async function getAuthAccessToken() {
    const basicAuthHeader = 'Basic ' + Buffer.from(`${AUTH_CLIENT_ID}:${AUTH_CLIENT_SECRET}`).toString('base64');
    const data = new URLSearchParams();
    data.append('grant_type', 'client_credentials');
    data.append('scope', 'openid account:read account:write');
    const r = await axios({
        url: '/token',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': basicAuthHeader,
        },
        data,
    });

    return `Bearer ${r.data.access_token}`;
}

export const authClient = axios;
