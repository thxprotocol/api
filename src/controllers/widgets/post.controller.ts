import { Request, Response } from 'express';
import { WIDGETS_URL } from '@/config/secrets';
import WidgetService from '@/services/WidgetService';
import ClientService from '@/services/ClientService';

export const postWidget = async (req: Request, res: Response) => {
    // #swagger.tags = ['Widgets']
    const client = await ClientService.create(req.user.sub, {
        application_type: 'web',
        grant_types: ['authorization_code'],
        request_uris: req.body.requestUris,
        redirect_uris: [WIDGETS_URL],
        post_logout_redirect_uris: req.body.postLogoutRedirectUris,
        response_types: ['code'],
        scope: 'openid user widget',
    });

    const widget = await WidgetService.create(
        req.user.sub,
        client.clientId,
        req.body.metadata.rewardId,
        req.body.metadata.poolAddress,
    );

    res.status(201).json(widget);
};
