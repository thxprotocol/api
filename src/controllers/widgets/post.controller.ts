import { Request, Response } from 'express';
import { body } from 'express-validator';

import { WIDGETS_URL } from '@/config/secrets';
import ClientProxy from '@/proxies/ClientProxy';
import WidgetService from '@/services/WidgetService';

const validation = [body('requestUris').exists(), body('postLogoutRedirectUris').exists(), body('metadata').exists()];

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['Widgets']
    const client = await ClientProxy.create(req.auth.sub, req.headers['X-PoolId'] as string, {
        application_type: 'web',
        grant_types: ['authorization_code'],
        request_uris: req.body.requestUris,
        redirect_uris: [WIDGETS_URL],
        post_logout_redirect_uris: req.body.postLogoutRedirectUris,
        response_types: ['code'],
        scope: 'openid rewards:read withdrawals:write',
    });

    const widget = await WidgetService.create(
        req.auth.sub,
        client.clientId,
        req.body.metadata.rewardId,
        req.body.metadata.poolId,
    );

    res.status(201).json(widget);
};

export default { controller, validation };
