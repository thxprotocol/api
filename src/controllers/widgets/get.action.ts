import { Request, Response } from 'express';
import WidgetService from '@/services/WidgetService';
import ClientService from '@/services/ClientService';
import { BadRequestError, NotFoundError } from '@/util/errors';

export const getWidget = async (req: Request, res: Response) => {
    const client = await ClientService.get(req.params.clientId);
    if (!client) {
        throw new BadRequestError('Could not find a client for this clientId.');
    }

    const widget = await WidgetService.get(req.params.clientId);
    if (!widget) {
        throw new NotFoundError();
    }

    res.json({
        requestUris: client.requestUris,
        clientId: client.clientId,
        clientSecret: client.clientSecret,
        registrationAccessToken: req.params.rat,
        metadata: {
            rewardId: widget.metadata.rewardId,
            poolAddress: widget.metadata.poolAddress,
        },
    });
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
