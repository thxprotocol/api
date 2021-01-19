import { SuperAgentTest } from 'supertest';

export const registerClientCredentialsClient = async (http: SuperAgentTest) => {
    const res = await http.post('/reg').send({
        application_type: 'web',
        client_name: 'TestClient',
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
            'scope': 'openid admin user',
        })
        .send({
            grant_type: 'client_credentials',
            scope: 'openid admin',
        });

    return 'Bearer ' + body.access_token;
};

export const registerAuthorizationCodeClient = async (http: SuperAgentTest) => {
    const res = await http.post('/reg').send({
        application_type: 'web',
        client_name: 'TestClient',
        grant_types: ['authorization_code'],
        redirect_uris: [],
        response_types: [],
        scope: 'openid user',
    });
    const { body } = await http
        .post('/token')
        .set({
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization':
                'Basic ' + Buffer.from(`${res.body.client_id}:${res.body.client_secret}`).toString('base64'),
            'scope': 'openid admin user',
        })
        .send({
            grant_type: 'client_credentials',
            scope: 'openid admin',
        });

    return 'Bearer ' + body.access_token;
};
