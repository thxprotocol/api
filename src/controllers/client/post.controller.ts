import { Request, Response } from 'express';

import ClientProxy from '@/proxies/ClientProxy';
import { BadRequestError } from '@/util/errors';

const addClientToPool = async (req: Request, res: Response) => {
    const poolId = req.headers['x-poolid'] as string;
    const grantType = req.body['grantType'];
    const redirectUri = req.body['redirectUri'];
    const requestUri = req.body['requestUri'];
    const name = req.body['name'];

    if (!poolId) throw new BadRequestError('Cannot found Pool ID in this request');
    const client = await ClientProxy.create(req.auth.sub, poolId, {
        client_name: name,
        application_type: 'web',
        grant_types: [grantType],
        request_uris: grantType === 'authorization_code' && requestUri ? [requestUri] : [],
        redirect_uris: grantType === 'authorization_code' && redirectUri ? [redirectUri] : [], // User Input 1 redirect
        post_logout_redirect_uris: [],
        response_types: [],
        scope: 'openid account:read account:write members:read members:write withdrawals:write',
    });

    res.status(200).send(client.toJSON());
};

export default {
    controller: addClientToPool,
};
