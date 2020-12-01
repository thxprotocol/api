import { basePollContract, gasStation } from '../../util/network';
import { HttpError } from '../../models/Error';
import { NextFunction, Request, Response } from 'express';
import { VERSION } from '../../util/secrets';

/**
 * @swagger
 * /polls/:address/vote:
 *   delete:
 *     tags:
 *       - Polls
 *     description: Cast a vote for a poll
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
 *       - name: voter
 *         in: body
 *         required: true
 *         type: string
 *       - name: nonce
 *         in: body
 *         required: true
 *         type: integer
 *       - name: sig
 *         in: body
 *         required: true
 *         type: string
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
 *
 */
export const deleteVote = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const instance = basePollContract(req.params.address);

        await instance.revokeVote(req.body.voter, parseInt(req.body.nonce, 10), req.body.sig);

        res.redirect(`/${VERSION}/polls/${req.params.address}`);
    } catch (err) {
        next(new HttpError(502, 'Base Poll revokeVote failed.', err));
    }
};
