import { Response, NextFunction } from 'express';
import { HttpError, HttpRequest } from '../../models/Error';
import { WIDGETS_URL } from '../../util/secrets';
import WidgetService from '../../services/WidgetService';
import ClientService from '../../services/ClientService';

export const postWidget = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        const { client, error } = await ClientService.create(req.user.sub, {
            application_type: 'web',
            grant_types: ['authorization_code'],
            request_uris: req.body.requestUris,
            redirect_uris: [WIDGETS_URL],
            post_logout_redirect_uris: req.body.postLogoutRedirectUris,
            response_types: ['code'],
            scope: 'openid user widget',
        });

        if (error) throw new Error(error.message);

        const { widget } = await WidgetService.create(
            req.user.sub,
            client.clientId,
            req.body.metadata.rewardId,
            req.body.metadata.poolAddress,
        );

        res.status(201).json(widget);
    } catch (e) {
        return next(new HttpError(502, 'Could not register your widget.'));
    }
};

/**
 * @swagger
 * /widgets:
 *   post:
 *     tags:
 *       - Widgets
 *     description: Post the widget
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: requestUris
 *         in: body
 *         required: true
 *         type: array
 *         items:
 *           type: string 
 *       - name: postLogoutRedirectUris
 *         in: body
 *         required: true
 *         type: array
 *         items:
 *           type: string
 *       - name: metadata
 *         in: body
 *         required: true
 *         type: object
 *         properties:
 *           rewardId:
 *             type: number
 *           poolAddress:
 *             type: string    
 *     responses:
 *       '201':
 *         description: OK
 *         content: application/json
 *         schema:
 *               type: object
 *               properties:
 *                 rat:
 *                   type: string
 *                 sub:
 *                   type: string
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     rewardId:
 *                       type: number
 *                     poolAddress:
 *                       type: string         
 *       '400':
 *         $ref: '#/components/responses/400'
 *       '401':
 *         $ref: '#/components/responses/401'
 *       '403':
 *         description: Forbidden. Your account does not have access to create widget.
 *       '500':
 *         $ref: '#/components/responses/500'
 *       '502':
 *         $ref: '#/components/responses/502'
 */