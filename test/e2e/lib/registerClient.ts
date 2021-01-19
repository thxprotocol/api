import { SuperAgentTest } from 'supertest';

export const registerClient = async (http: SuperAgentTest) => {
    const res = await http.post('/reg').send({
        application_type: 'web',
        client_name: 'TestClient',
        grant_types: ['client_credentials'],
        redirect_uris: [],
        response_types: [],
        scope: 'openid admin',
    });
    return 'Basic ' + Buffer.from(`${res.body.client_id}:${res.body.client_secret}`).toString('base64');
};
