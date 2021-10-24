import { Response, NextFunction } from 'express';
import { HttpError, HttpRequest } from '../../models/Error';
import WidgetService from '../../services/WidgetService';
import ClientService from '../../services/ClientService';
import RatService from '../../services/RatService';

export const getWidget = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        const { rat } = await RatService.get(req.params.rat);

        if (!rat) {
            return next(new HttpError(500, 'Could not find this registration_access_token.'));
        }

        const { client } = await ClientService.get(rat.payload['clientId']);

        if (!client) {
            return next(new HttpError(500, 'Could not find a client for this registration_access_token.'));
        }

        const { widget } = await WidgetService.get(req.params.rat);

        if (!widget) {
            return next(new HttpError(500, 'Could not find a widget for this registration_access_token.'));
        }

        res.json({
            requestUris: client.payload['request_uris'],
            clientId: client.payload['client_id'],
            clientSecret: client.payload['client_secret'],
            registrationAccessToken: req.params.rat,
            metadata: {
                rewardId: widget.metadata.rewardId,
                poolAddress: widget.metadata.poolAddress,
            },
        });
    } catch (e) {
        next(new HttpError(500, 'Could not return client information.', e));
    }
};


/**
 * @swagger
 * /widgets/:rat:
 *   get:
 *     tags:
 *       - Widgets
 *     description: Gets the widget based on rat.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: rat
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       '200':
 *         description: OK
 *         content: application/json
 *         schema:
 *               type: object
 *               properties:
 *                 requestUris:
 *                   type: array
 *                   items:
 *                     type: string
 *                 clientId:
 *                   type: string
 *                 clientSecret:
 *                   type: string
 *                 registrationAccessToken:
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
 *         description: Forbidden. Your account does not have access to this widget information.
 *       '404':
 *         description: Not Found. Widget information not found.
 *       '500':
 *         $ref: '#/components/responses/500'
 *       '502':
 *         $ref: '#/components/responses/502'
 */