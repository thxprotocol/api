import { NextFunction, Request, Response } from 'express';
import { ASSET_POOL, gasStation, parseResultLog } from '../../util/network';
import { HttpError } from '../../models/Error';
import { VERSION } from '../../util/secrets';
import '../../config/passport';

/**
 * @swagger
 * /withdrawals/:address/withdraw:
 *   post:
 *     tags:
 *       - Withdrawals
 *     description: Create a quick response image for withdrawing the reward.
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
export const postWithdrawalWithdraw = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tx = await (
            await gasStation.call(req.body.call, req.params.address, req.body.nonce, req.body.sig)
        ).wait();

        try {
            const { error, logs } = await parseResultLog(ASSET_POOL.abi, tx.logs);

            if (error) {
                throw error;
            }

            const event = logs.filter((e: any) => e && e.name === 'Withdrawn')[0];

            res.redirect(`/${VERSION}/members/${event.args.member}`);
        } catch (error) {
            next(new HttpError(500, 'Parse logs failed.', error));
        }
    } catch (err) {
        next(new HttpError(502, 'Gas Station call failed.', err));
    }
};
