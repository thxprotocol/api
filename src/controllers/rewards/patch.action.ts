import { Response, NextFunction } from 'express';
import { HttpRequest, HttpError } from '../../models/Error';
import qrcode from 'qrcode';
import { Reward } from '../../models/Reward';
import { formatEther } from '@ethersproject/units';
import { toWei, fromWei } from 'web3-utils';
import { getRewardData } from './getReward.action';
import { callFunction, sendTransaction } from '../../util/network';

/**
 * @swagger
 * /rewards/:id:
 *   patch:
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
 *         description: OK
 *         schema:
 *            type: object
 *            properties:
 *               base64:
 *                  type: string
 *                  description: Base64 string representing function call
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
export const patchReward = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        let { withdrawAmount, withdrawDuration } = await callFunction(
            req.solution.methods.getReward(req.params.id),
            req.assetPool.network,
        );

        withdrawAmount = Number(fromWei(withdrawAmount.toString()));
        withdrawDuration = Number(withdrawDuration);

        if (
            req.body.withdrawAmount &&
            withdrawAmount === req.body.withdrawAmount &&
            req.body.withdrawDuration &&
            withdrawDuration === req.body.withdrawDuration
        ) {
            return res.json(await getRewardData(req.solution, Number(req.params.id), req.assetPool.network));
        }

        if (req.body.withdrawAmount && withdrawAmount !== req.body.withdrawAmount) {
            withdrawAmount = toWei(req.body.withdrawAmount.toString());
        }

        if (req.body.withdrawDuration && withdrawDuration !== req.body.withdrawDuration) {
            withdrawDuration = Number(req.body.withdrawDuration);
        }

        try {
            const duration = Number(
                await callFunction(req.solution.methods.getRewardPollDuration(), req.assetPool.network),
            );

            const tx = await sendTransaction(
                req.solution.methods.updateReward(req.params.id, withdrawAmount, withdrawDuration),
                req.assetPool.network,
            );

            if (req.assetPool.bypassPolls && duration === 0) {
                try {
                    const event = tx.events.RewardPollCreated;
                    const id = Number(event.returnValues.rewardID);
                    const pollId = Number(event.returnValues.id);

                    try {
                        const tx = await sendTransaction(
                            req.solution.methods.rewardPollFinalize(pollId),
                            req.assetPool.network,
                        );

                        try {
                            const event = tx.events.RewardPollUpdated;

                            if (event) {
                                const withdrawAmount = Number(fromWei(event.returnValues.amount));
                                const withdrawDuration = Number(event.returnValues.duration);
                                const reward = await Reward.findOne({
                                    id: req.params.id,
                                    poolAddress: req.solution.options.address,
                                });

                                reward.withdrawAmount = withdrawAmount;
                                reward.withdrawDuration = withdrawDuration;
                                reward.state = 1;

                                await reward.save();
                            }

                            try {
                                res.json(await getRewardData(req.solution, id, req.assetPool.network));
                            } catch (e) {
                                return next(new HttpError(502, 'Could not get reward information from the pool.', e));
                            }
                        } catch (err) {
                            return next(new HttpError(500, 'Could not parse the transaction event logs.', err));
                        }
                    } catch (e) {
                        return next(new HttpError(502, 'Could not finalize the reward.'));
                    }
                } catch (e) {
                    return next(new HttpError(502, 'Could not update the reward.', e));
                }
            } else {
                const base64 = await qrcode.toDataURL(
                    JSON.stringify({
                        assetPoolAddress: req.header('AssetPool'),
                        contractAddress: req.header('AssetPool'),
                        contract: 'AssetPool',
                        method: 'updateReward',
                        params: {
                            id: req.params.id,
                            withdrawAmount,
                            withdrawDuration,
                        },
                    }),
                );
                res.json({ base64 });
            }
        } catch (e) {
            return next(new HttpError(500, 'Could not determine if governance is enabled for this reward.', e));
        }
    } catch (error) {
        return next(new HttpError(502, 'Could not get reward information from the pool.', error));
    }
};
