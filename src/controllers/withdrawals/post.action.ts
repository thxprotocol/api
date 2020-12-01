import { NextFunction, Request, Response } from 'express';
import { ASSET_POOL, gasStation, parseResultLog } from '../../util/network';
import { HttpError } from '../../models/Error';
import { VERSION } from '../../util/secrets';

/**
 * @swagger
 * /withdrawals:
 *   post:
 *     tags:
 *       - Withdrawals
 *     description: Propose a withdrawal in the asset pool.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: AssetPool
 *         in: header
 *         required: true
 *         type: string
 *       - name: amount
 *         in: body
 *         required: true
 *         type: integer
 *       - name: beneficiary
 *         in: body
 *         required: true
 *         type: string
 *     responses:
 *       '200':
 *          description: OK
 *       '302':
 *          description: Redirect to `GET /withdrawals/:address`
 *          headers:
 *             Location:
 *                type: string
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
export const postWithdrawal = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tx = await (
            await gasStation.call(req.body.call, req.header('AssetPool'), req.body.nonce, req.body.sig)
        ).wait();

        try {
            const { error, logs } = await parseResultLog(ASSET_POOL.abi, tx.logs);

            if (error) {
                throw error;
            }

            const event = logs.filter((e: { name: string }) => e.name === 'WithdrawPollCreated')[0];
            const pollAddress = event.args.poll;

            res.redirect(`/${VERSION}/withdrawals/${pollAddress}`);
        } catch (err) {
            next(new HttpError(500, 'Parse logs failed.', err));
            return;
        }
    } catch (err) {
        next(new HttpError(502, 'Gas Station call failed.', err));
    }
};
