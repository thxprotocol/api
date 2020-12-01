import { NextFunction, Request, Response } from 'express';
import { assetPoolContract } from '../../util/network';
import { HttpError } from '../../models/Error';

/**
 * @swagger
 * /withdrawals:
 *   get:
 *     tags:
 *       - withdrawals
 *     description: Get a list of withdrawals for the asset pool.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: AssetPool
 *         in: header
 *         required: true
 *         type: string
 *     responses:
 *       '200':
 *          description: OK
 *          schema:
 *              withdrawPolls:
 *                  type: array
 *                  items:
 *                      type: string
 *       '400':
 *          description: Bad Request. Indicates incorrect body parameters.
 *       '401':
 *          description: Unauthorized. Authenticate your request please.
 *       '403':
 *          description: Forbidden. Your account does not have access to this pool.
 *       '500':
 *          description: Internal Server Error.
 *       '502':
 *          description: Bad Gateway. Received an invalid response from the network or database.
 */
export const getWithdrawals = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const instance = assetPoolContract(req.header('AssetPool'));
        const filter = instance.filters.WithdrawPollCreated(req.body.member, null);
        const logs = await instance.queryFilter(filter, 0, 'latest');

        res.json({
            withdrawPolls: logs.map((log) => {
                return log.args.poll;
            }),
        });
    } catch (err) {
        next(new HttpError(502, 'Get WithdrawPollCreated logs failed.', err));
    }
};
