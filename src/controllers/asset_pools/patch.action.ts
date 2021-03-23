import { downgradeFromBypassPolls, updateToBypassPolls } from '../../util/factory';
import { Response, NextFunction } from 'express';
import { VERSION } from '../../util/secrets';
import { HttpRequest, HttpError } from '../../models/Error';
import { AssetPool } from '../../models/AssetPool';

/**
 * @swagger
 * /asset_pools/:address:
 *   patch:
 *     tags:
 *       - Asset Pools
 *     description: Updates the configuration for this asset pool. RewardPollDuration and ProposeWithdrawPollDuration are set in seconds. BypassPolls will upgrade or downgrade the asset pool with governance logic.
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
 *       - name: bypassPolls
 *         in: body
 *         required: false
 *         type: boolean
 *       - name: rewardPollDuration
 *         in: body
 *         required: false
 *         type: number
 *       - name: proposeWithdrawPollDuration
 *         in: body
 *         required: false
 *         type: number
 *     responses:
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
    const assetPool = await AssetPool.findOne({
        address: req.solution.address,
    });

    if (!assetPool) {
        return next(new HttpError(404, 'Could not find an asset pool for this address.'));
    }

    if (req.body.bypassPolls === true && assetPool.bypassPolls === false) {
        try {
            await updateToBypassPolls(req.solution);
            assetPool.bypassPolls = req.body.bypassPolls;

            await assetPool.save();
        } catch (error) {
            return next(new HttpError(502, 'Asset Pool updateToBypassPolls failed.', error));
        }
    }

    if (req.body.bypassPolls === false && assetPool.bypassPolls === true) {
        try {
            await downgradeFromBypassPolls(req.solution);
            assetPool.bypassPolls = req.body.bypassPolls;
            await assetPool.save();
        } catch (error) {
            return next(new HttpError(502, 'Asset Pool downgradeFromBypassPolls failed.', error));
        }
    }

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
