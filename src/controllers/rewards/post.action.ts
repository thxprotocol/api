import { Response, NextFunction } from 'express';
import { HttpError, HttpRequest } from '../../models/Error';
import { VERSION } from '../../util/secrets';
import { callFunction, sendTransaction } from '../../util/network';
import { toWei } from 'web3-utils';
import { parseLogs, findEvent } from '../../util/events';
import { Artifacts } from '../../util/artifacts';
import RewardService from '../../services/RewardService';

/**
 * @swagger
 * /rewards:
 *   post:
 *     tags:
 *       - Rewards
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: AssetPool
 *         in: header
 *         required: true
 *         type: string
 *       - name: withdrawAmount
 *         in: body
 *         required: true
 *         type: integer
 *       - name: withdrawDuration
 *         in: body
 *         required: true
 *         type: integer
 *     responses:
 *       '200':
 *          description: OK
 *       '302':
 *          headers:
 *              Location:
 *                  type: string
 *                  description: Redirect route to /reward/:id
 *       '400':
 *         $ref: '#/components/responses/400'
 *       '401':
 *         $ref: '#/components/responses/401'
 *       '403':
 *         description: Forbidden. Your account does not have access to this pool.
 *       '500':
 *         $ref: '#/components/responses/500'
 *       '502':
 *         $ref: '#/components/responses/502'
 */
export const postReward = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        const withdrawAmount = toWei(req.body.withdrawAmount.toString());
        const tx = await sendTransaction(
            req.solution.options.address,
            req.solution.methods.addReward(withdrawAmount, req.body.withdrawDuration),
            req.assetPool.network,
        );

        try {
            const events = parseLogs(Artifacts.IDefaultDiamond.abi, tx.logs);
            const event = findEvent('RewardPollCreated', events);
            const id = Number(event.args.rewardID);
            const pollId = Number(event.args.id);

            try {
                await RewardService.create(req.assetPool, req.solution, id, pollId, 0);
                res.redirect(`/${VERSION}/rewards/${id}`);
            } catch (e) {
                return next(new HttpError(502, e.message, e));
            }
        } catch (err) {
            return next(new HttpError(500, 'Could not parse the transaction event logs.', err));
        }
    } catch (err) {
        return next(new HttpError(502, 'Could not add the reward to the asset pool contract.', err));
    }
};
