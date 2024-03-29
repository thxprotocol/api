import { Request, Response } from 'express';
import { BadRequestError } from '@/util/errors';
import { GrantType } from '@/types/enums/GrantType';
import ClientProxy from '@/proxies/ClientProxy';

export default {
    controller: async (req: Request, res: Response) => {
        /*
        #swagger.tags = ['Client']
        #swagger.responses[200] = { 
            description: 'Create a set of client credentials',
            schema: { $ref: '#/definitions/Client' } 
        }
        */
        const poolId = req.headers['x-poolid'] as string;
        if (!poolId) throw new BadRequestError('Cannot found Pool ID in this request');

        const { grantType, redirectUri, requestUri, name } = req.body;
        let payload;
        switch (grantType) {
            case GrantType.AuthorizationCode:
                payload = {
                    application_type: 'web',
                    grant_types: [grantType],
                    request_uris: [requestUri],
                    redirect_uris: [redirectUri],
                    post_logout_redirect_uris: [requestUri],
                    response_types: ['code'],
                    scope: 'openid account:read erc20:read erc721:read',
                };
                break;
            case GrantType.ClientCredentials:
                payload = {
                    application_type: 'web',
                    grant_types: [grantType],
                    redirect_uris: [],
                    response_types: [],
                    scope: 'openid withdrawals:read withdrawals:write',
                };
                break;
        }

        const client = await ClientProxy.create(req.auth.sub, poolId, payload, name);

        res.json(client);
    },
};
