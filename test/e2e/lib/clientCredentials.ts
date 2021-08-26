export const getClientCredentialsToken = async (http: any) => {
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

    return {
        accessToken: 'Bearer ' + body.access_token,
        aud: res.body.client_id,
    };
};
