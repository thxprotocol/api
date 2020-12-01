import { gasStation } from '../../util/network';
import { HttpError } from '../../models/Error';
import { NextFunction, Request, Response } from 'express';
import { VERSION } from '../../util/secrets';

/**
 * @swagger
 * /polls/:address/finalize:
 *   post:
 *     tags:
 *       - Rewards
 *     description: Finalize the reward and update struct
 *     produces:
 *       - application/json
 *     responses:
 *       '200':
 *         description: OK
 *       '302':
 *          description: Redirect to `GET /polls/:address`
 *          headers:
 *             Location:
 *                type: string
 *       '400':
 *         description: Bad Request. Indicates incorrect body parameters.
 *       '401':
 *         description: Unauthorized. Authenticate your request please.
 *       '403':
 *         description: Forbidden. Your account does not have access to this pool.
 *       '500':
 *         description: Internal Server Error.
 *       '502':
 *         description: Bad Gateway. Received an invalid response from the network or database.
 */
export const postPollFinalize = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tx = await gasStation.call(req.body.call, req.params.address, req.body.nonce, req.body.sig);
        await tx.wait();

        res.redirect(`/${VERSION}/polls/${req.params.address}`);
    } catch (err) {
        next(new HttpError(502, 'Gas Station call failed.', err));
    }
};
