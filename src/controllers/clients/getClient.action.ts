import { Response, NextFunction } from 'express';
import { HttpError, HttpRequest } from '../../models/Error';
import RatService from '../../services/RatService';
import ClientService from '../../services/ClientService';

export const getClient = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        const { rat } = await RatService.get(req.params.rat);

        if (!rat) {
            return next(new HttpError(500, 'Could not find this registration_access_token.'));
        }

        const { client } = await ClientService.get(rat.payload['clientId']);

        if (!client) {
            return next(new HttpError(500, 'Could not find a client for this registration_access_token.'));
        }

        res.json({
            requestUris: client.payload['request_uris'],
            clientId: client.payload['client_id'],
            clientSecret: client.payload['client_secret'],
            registrationAccessToken: req.params.rat,
        });
    } catch (e) {
        next(new HttpError(500, 'Could not return client information.', e));
    }
};

/**
 * @swagger
 * /clients/:rat:
 *   get:
 *     tags:
 *       - Clients
 *     description: Provides information about a client.
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
 *         schema:
 *           type: object
 *           properties:
 *             requestUris:
 *               type: array
 *               items:
 *                 type: string
 *             clientId:
 *               type: string
 *             clientSecret:
 *               type: string
 *             registrationAccessToken:
 *               type: string
 *       '400':
 *         description: Bad Request. Indicates incorrect body parameters.
 *       '401':
 *         description: Unauthorized. Authenticate your request please.
 *       '403':
 *         description: Forbidden. Your account does not have access to this client information.
 *       '404':
 *         description: Not Found. Client information not found.
 *       '500':
 *         description: Internal Server Error.
 *       '502':
 *         description: Bad Gateway. Received an invalid response from the network or database.
 */
