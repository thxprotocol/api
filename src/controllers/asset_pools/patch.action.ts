import { Request, Response, NextFunction } from 'express';
import { solutionContract } from '../../util/network';
import { VERSION } from '../../util/secrets';
import { HttpError } from '../../models/Error';

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
export const patchAssetPool = async (req: Request, res: Response, next: NextFunction) => {
    const instance = solutionContract(req.header('AssetPool'));

    if (
        req.body.rewardPollDuration &&
        (await instance.getRewardPollDuration()).toString() !== req.body.rewardPollDuration.toString()
    ) {
        try {
            await instance.setRewardPollDuration(req.body.rewardPollDuration);
        } catch (error) {
            next(new HttpError(502, 'Asset Pool setRewardPollDuration failed.', error));
            return;
        }
    }

    if (
        req.body.proposeWithdrawPollDuration &&
        (await instance.getProposeWithdrawPollDuration()).toString() !== req.body.proposeWithdrawPollDuration.toString()
    ) {
        try {
            await instance.setProposeWithdrawPollDuration(req.body.proposeWithdrawPollDuration);
        } catch (error) {
            next(new HttpError(502, 'Asset Pool setProposeWithdrawPollDuration failed.', error));
            return;
        }
    }

    res.redirect(`/${VERSION}/asset_pools/${req.params.address}`);
};
