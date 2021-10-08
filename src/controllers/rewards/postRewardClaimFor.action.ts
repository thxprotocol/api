import { Response, NextFunction } from 'express';
import { parseLogs, findEvent } from '../../util/events';
import { HttpError, HttpRequest } from '../../models/Error';
import { callFunction, sendTransaction } from '../../util/network';
import { Artifacts } from '../../util/artifacts';
import WithdrawalService from '../../services/WithdrawalService';

/**
 * @swagger
 * /rewards/:id/give:
 *   post:
 *     tags:
 *       - Rewards
 *     description: Create a quick response image to claim the reward.
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
 *         type: integer
 *       - name: member
 *         in: body
 *         required: true
 *         type: string
 *     responses:
 *       '200':
 *         description: OK
 *         schema:
 *            type: object
 *            properties:
 *               withdrawPoll:
 *                  type: string
 *                  description: Address off the withdraw poll
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
export const postRewardClaimFor = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        const result = await callFunction(req.solution.methods.getReward(req.params.id), req.assetPool.network);

        if (!result) {
            throw new Error(result);
        }

        try {
            const tx = await sendTransaction(
                req.solution.options.address,
                req.solution.methods.claimRewardFor(req.params.id, req.body.member),
                req.assetPool.network,
            );

            try {
                const events = parseLogs(Artifacts.IDefaultDiamond.abi, tx.logs);
                const event = findEvent('WithdrawPollCreated', events);
                const rewardId = Number(req.params.id);
                const withdrawal = await WithdrawalService.save(
                    req.assetPool,
                    event.args.id,
                    event.args.member,
                    rewardId,
                );
                if (!withdrawal) {
                    return next(new HttpError(500, 'Withdrawal already exists.'));
                }
                await withdrawal.save();

                res.json({ withdrawal: withdrawal.id });
            } catch (err) {
                return next(new HttpError(500, 'Could not parse the transaction for this reward claim.', err));
            }
        } catch (err) {
            return next(new HttpError(502, 'Could not claim the reward for this member.', err));
        }
    } catch (err) {
        next(new HttpError(502, 'Could not find this reward on the network.', err));
    }
};
