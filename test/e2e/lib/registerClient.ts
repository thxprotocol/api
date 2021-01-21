import { ISSUER } from '../../../src/util/secrets';

export const registerClientCredentialsClient = async (http: any) => {
    const res = await http.post('/reg').send({
        application_type: 'web',
        client_name: 'TestAdminClient',
        grant_types: ['client_credentials'],
        redirect_uris: [],
        response_types: [],
        scope: 'openid admin',
    });
    const { body } = await http
        .post('/token')
        .set({
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization':
                'Basic ' + Buffer.from(`${res.body.client_id}:${res.body.client_secret}`).toString('base64'),
        })
        .send({
            grant_type: 'client_credentials',
            scope: 'openid admin',
        });

    return 'Bearer ' + body.access_token;
};

export const registerAuthorizationCodeClient = async (http: any) => {
    async function registerClient() {
        const res = await http.post('/reg').send({
            application_type: 'web',
            client_name: 'TestUserClient',
            grant_types: ['authorization_code'],
            redirect_uris: ['http://localhost:3002/signin-oidc'],
            response_types: ['code'],
            response_modes: ['query'],
            scope: 'openid user profile email address privateKey offline_access',
        });
        return {
            client_id: res.body.client_id,
            client_secret: res.body.client_secret,
        };
    }
    const { client_id, client_secret } = await registerClient();

    return { client_id, client_secret };
};

export async function getAuthHeaders(http: any, client: { client_id: string; client_secret: string }) {
    const r = await http
        .post('/auth')
        .set({
            'Content-Type': 'application/x-www-form-urlencoded',
        })
        .send({
            client_id: client.client_id,
            client_secret: client.client_secret,
            grant_type: 'authorization_grant',
            authority: ISSUER,
            response_type: 'code',
            scope: 'openid user profile email address privateKey offline_access',
            response_mode: 'query',
            redirect_uri: 'http://localhost:3002/signin-oidc',
            state: '493ce369e1704035888b7620f2bebb35',
            id_token_signed_response_alg: 'RS256',
        });
    return r.headers;
}

export async function getAccessToken(http: any, client: any, authCode: string) {
    const res = await http
        .post('/token')
        .set({
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + Buffer.from(`${client.client_id}:${client.client_secret}`).toString('base64'),
        })
        .send({
            grant_type: 'authorization_code',
            code: authCode,
        });
    return `Bearer ${res.body.access_token}`;
}

export async function getAuthCode(
    http: any,
    headers: any,
    client: { client_id: string; client_secret: string },
    user: {
        email: string;
        password: string;
    },
) {
    async function postInteraction(url: string) {
        // /interaction/274csQ0M6h1qMfXRycgtq
        const r = await http
            .post(url + '/login')
            .withCredentials()
            .send({
                email: user.email,
                password: user.password,
            });
        // console.log('POST URL: ', url, r.status, r.headers.location);
        return r.headers.location;
    }
    function getPath(url: string) {
        return '/' + url.split('/')[3] + '/' + url.split('/')[4];
    }

    try {
        let url = await postInteraction(headers.location);

        try {
            // /auth/274csQ0M6h1qMfXRycgtq
            const path = getPath(url);
            const r = await http.get(path).withCredentials();
            url = r.headers.location;
            // console.log('GET1 URL: ', path, r.status, r.headers.location, r.headers, r.body, r.text);

            try {
                // /interaction/274csQ0M6h1qMfXRycgtq
                const r = await http.get(url).withCredentials();
                url = r.headers.location;
                // console.log('GET2 URL: ', url, r.status, r.headers.location, r.headers, r.body, r.text);

                try {
                    const path = getPath(url);
                    const r = await http.get(path).withCredentials();
                    // console.log('GET3 URL: ', path, r.status, r.headers.location, r.headers, r.body, r.text);

                    return r.headers.location.split('code=')[1].split('&')[0];
                } catch (e) {
                    console.log(e);
                }
            } catch (e) {
                console.log(e);
            }
        } catch (e) {
            console.log(e);
        }
    } catch (e) {
        console.log(e);
    }
}
