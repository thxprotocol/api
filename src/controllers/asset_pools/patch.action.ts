import { Response, NextFunction } from 'express';
import { VERSION } from '../../util/secrets';
import { HttpRequest, HttpError } from '../../models/Error';

/**
 * @swagger
 * /asset_pools/:address/:
 *   patch:
 *     tags:
 *       - Asset Pools
 *     description: Update the configuration for this asset pool
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
 *       - name: rewardPollDuration
 *         in: body
 *         required: true
 *         type: integer
 *       - name: proposeWithdrawPollDuration
 *         in: body
 *         required: true
 *         type: integer
 *     responses:
 *       '200':
 *         description: OK
 *       '302':
 *         description: Redirect. Redirects to `GET /asset_pools/:address`
 *       '400':
 *         description: Bad Request. Could indicate incorrect rewardPollDuration or proposeWithdrawPollDuration values.
 *       '401':
 *         description: Unauthorized. Authenticate your request please.
 *       '403':
 *         description: Forbidden. Your account does not have access to this pool.
 *       '500':
 *         description: Internal Server Error.
 *       '502':
 *         description: Bad Gateway. Received an invalid response from the network or database.
 */
export const patchAssetPool = async (req: HttpRequest, res: Response, next: NextFunction) => {
    if (
        req.body.rewardPollDuration &&
        (await req.solution.getRewardPollDuration()).toString() !== req.body.rewardPollDuration.toString()
    ) {
        try {
            await req.solution.setRewardPollDuration(req.body.rewardPollDuration);
        } catch (error) {
            return next(new HttpError(502, 'Asset Pool setRewardPollDuration failed.', error));
        }
    }

    if (
        req.body.proposeWithdrawPollDuration &&
        (await req.solution.getProposeWithdrawPollDuration()).toString() !==
            req.body.proposeWithdrawPollDuration.toString()
    ) {
        try {
            await req.solution.setProposeWithdrawPollDuration(req.body.proposeWithdrawPollDuration);
        } catch (error) {
            return next(new HttpError(502, 'Asset Pool setProposeWithdrawPollDuration failed.', error));
        }
    }

    res.redirect(`/${VERSION}/asset_pools/${req.params.address}`);
};
