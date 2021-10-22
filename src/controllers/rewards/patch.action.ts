import { Response, NextFunction } from 'express';
import { HttpRequest, HttpError } from '../../models/Error';
import qrcode from 'qrcode';
import { toWei, fromWei } from 'web3-utils';
import { getRewardData } from './getReward.action';
import { callFunction, sendTransaction } from '../../util/network';
import { parseLogs, findEvent } from '../../util/events';
import { Artifacts } from '../../util/artifacts';
import RewardService from '../../services/RewardService';

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
 *         content:
 *           application/json: 
 *             schema:
 *               type: object
 *               properties:
 *                 base64:
 *                   type: string
 *                   description: Base64 string representing function call
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
                req.solution.options.address,
                req.solution.methods.updateReward(req.params.id, withdrawAmount, withdrawDuration),
                req.assetPool.network,
            );

            if (req.assetPool.bypassPolls && duration === 0) {
                try {
                    const events = parseLogs(Artifacts.IDefaultDiamond.abi, tx.logs);
                    const event = findEvent('RewardPollCreated', events);
                    const id = Number(event.args.rewardID);
                    const pollId = Number(event.args.id);

                    try {
                        const tx = await sendTransaction(
                            req.solution.options.address,
                            req.solution.methods.rewardPollFinalize(pollId),
                            req.assetPool.network,
                        );

                        try {
                            const events = parseLogs(Artifacts.IDefaultDiamond.abi, tx.logs);
                            const event = findEvent('RewardPollUpdated', events);

                            if (event) {
                                const withdrawAmount = Number(fromWei(event.args.amount.toString()));
                                const withdrawDuration = Number(event.args.duration);
                                const { reward } = await RewardService.get(
                                    req.solution.options.address,
                                    Number(req.params.id),
                                );

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
