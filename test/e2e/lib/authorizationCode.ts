import { AUTH_URL } from '../../../src/util/secrets';

function getPath(url: string) {
    return '/' + url.split('/')[3] + '/' + url.split('/')[4];
}

export const getAuthCodeToken = async (http: any, scope: string, userEmail: string, userPassword: string) => {
    const r = await http.post('/reg').send({
        application_type: 'web',
        grant_types: ['authorization_code'],
        redirect_uris: ['http://localhost:3002/signin-oidc'],
        response_types: ['code'],
        response_modes: ['query'],
        scope,
    });
    const clientId = r.body.client_id;
    const clientSecret = r.body.client_secret;

    try {
        const r = await http
            .post('/auth')
            .set({
                'Content-Type': 'application/x-www-form-urlencoded',
            })
            .send({
                client_id: clientId,
                client_secret: clientSecret,
                grant_type: 'authorization_grant',
                authority: AUTH_URL,
                response_type: 'code',
                scope,
                response_mode: 'query',
                redirect_uri: 'http://localhost:3002/signin-oidc',
                id_token_signed_response_alg: 'RS256',
            });
        let url = r.headers.location;

        try {
            const r = await http
                .post(url + '/login')
                .set({
                    'Content-Type': 'application/x-www-form-urlencoded',
                })
                .withCredentials()
                .send({
                    email: userEmail,
                    password: userPassword,
                });
            url = getPath(r.headers.location);

            try {
                const r = await http.get(url).withCredentials();
                url = r.headers.location;

                try {
                    const r = await http.get(url).withCredentials();
                    url = r.headers.location;

                    try {
                        const path = getPath(url);
                        const r = await http.get(path).withCredentials();
                        const authCode = r.headers.location.split('code=')[1].split('&')[0];
                        const res = await http
                            .post('/token')
                            .set({
                                'Content-Type': 'application/x-www-form-urlencoded',
                                'Authorization':
                                    'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
                            })
                            .send({
                                grant_type: 'authorization_code',
                                code: authCode,
                            });

                        return `Bearer ${res.body.access_token}`;
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
    } catch (e) {
        console.log(e);
    }
};
