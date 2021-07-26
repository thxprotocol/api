import { Response, NextFunction } from 'express';
import { Reward } from '@/models/Reward';
import { HttpError, HttpRequest } from '@/models/Error';
import { VERSION } from '@/util/secrets';
import { callFunction, sendTransaction } from '@/util/network';
import { toWei } from 'web3-utils';
import { parseLogs, findEvent } from '@/util/events';
import { Artifacts } from '@/util/artifacts';

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
                const reward = new Reward({
                    id,
                    poolAddress: req.solution.options.address,
                    withdrawAmount: await callFunction(
                        req.solution.methods.getWithdrawAmount(id),
                        req.assetPool.network,
                    ),
                    withdrawDuration: await callFunction(
                        req.solution.methods.getWithdrawDuration(id),
                        req.assetPool.network,
                    ),
                    state: 0,
                });

                await reward.save();

                try {
                    const duration = Number(
                        await callFunction(req.solution.methods.getRewardPollDuration(), req.assetPool.network),
                    );

                    if (req.assetPool.bypassPolls && duration === 0) {
                        try {
                            const tx = await sendTransaction(
                                req.solution.options.address,
                                req.solution.methods.rewardPollFinalize(pollId),
                                req.assetPool.network,
                            );

                            try {
                                const events = parseLogs(Artifacts.IDefaultDiamond.abi, tx.logs);
                                const event = findEvent('RewardPollEnabled', events);

                                if (event) {
                                    reward.state = 1;
                                    await reward.save();
                                }

                                res.redirect(`/${VERSION}/rewards/${id}`);
                            } catch (err) {
                                return next(new HttpError(500, 'Could not parse the transaction event logs.', err));
                            }
                        } catch (e) {
                            return next(new HttpError(502, 'Could not finalize the reward.'));
                        }
                    } else {
                        res.redirect(`/${VERSION}/rewards/${id}`);
                    }
                } catch (e) {
                    return next(new HttpError(502, 'Could determine if governance is disabled for this reward.', e));
                }
            } catch (e) {
                return next(new HttpError(502, 'Could not store the reward in the database.', e));
            }
        } catch (err) {
            return next(new HttpError(500, 'Could not parse the transaction event logs.', err));
        }
    } catch (err) {
        return next(new HttpError(502, 'Could not add the reward to the asset pool contract.', err));
    }
};
