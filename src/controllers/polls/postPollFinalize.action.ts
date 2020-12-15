import { HttpError } from '../../models/Error';
import { NextFunction, Request, Response } from 'express';
import { basePollContract } from '../../util/network';

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
 *       - name: address
 *         in: path
 *         required: true
 *         type: string
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
export const postPollFinalize = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const pollInstance = basePollContract(req.params.address);
        const tx = await (await pollInstance.finalize()).wait();

        res.json({ transactionHash: tx.transactionHash });
    } catch (err) {
        next(new HttpError(502, 'Asset Pool addReward failed.', err));
    }
};
