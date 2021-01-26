import { HttpError, HttpRequest } from '../../models/Error';
import { NextFunction, Response } from 'express';

/**
 * @swagger
 * /polls/:address/finalize:
 *   post:
 *     tags:
 *       - Polls
 *     description: Finalize the poll contracts.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: AssetPool
 *         in: header
 *         required: true
 *         type: string
 *       - name: id
 *         in: path
 *         required: true
 *         type: number
 *     responses:
 *       '200':
 *         description: OK
 *         schema:
 *            type: object
 *            properties:
 *               base64:
 *                  type: string
 *                  description: Base64 string representing function call
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
export const postPollFinalize = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        const tx = await (await req.solution.rewardPollFinalize(req.params.id)).wait();

        res.json({ transactionHash: tx.transactionHash });
    } catch (err) {
        next(new HttpError(502, 'BasePoll finalize failed.', err));
    }
};
