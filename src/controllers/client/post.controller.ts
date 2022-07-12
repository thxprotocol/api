import { Request, Response } from 'express';

import ClientProxy from '@/proxies/ClientProxy';
import { BadRequestError } from '@/util/errors';

const addClientToPool = async (req: Request, res: Response) => {
    const poolId = req.headers['X-PoolId'] as string;
    if (!poolId) throw new BadRequestError('Cannot found Pool ID in this request');
    const client = await ClientProxy.create(req.auth.sub, poolId, {
        application_type: 'web',
        grant_types: ['client_credentials'],
        request_uris: [],
        redirect_uris: [],
        post_logout_redirect_uris: [],
        response_types: [],
        scope: 'openid account:read account:write members:read members:write withdrawals:write',
    });

    res.status(200).send(client.toJSON());
};

export default {
    controller: addClientToPool,
};
