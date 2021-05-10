import IDefaultDiamondArtifact from '../../../src/artifacts/contracts/contracts/IDefaultDiamond.sol/IDefaultDiamond.json';
import { Response, NextFunction } from 'express';
import { HttpRequest, HttpError } from '../../models/Error';
import qrcode from 'qrcode';
import { parseLogs } from '../../util/events';
import { VERSION } from '../../util/secrets';
import { Reward } from '../../models/Reward';
import { formatEther } from '@ethersproject/units';
import { parseEther } from 'ethers/lib/utils';
import { getRewardData } from './getReward.action';

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
        let { withdrawAmount, withdrawDuration } = await req.solution.getReward(req.params.id);

        if (req.body.withdrawAmount && withdrawAmount !== req.body.withdrawAmount) {
            withdrawAmount = parseEther(req.body.withdrawAmount.toString());
        }

        if (req.body.withdrawDuration && withdrawDuration !== req.body.withdrawDuration) {
            withdrawDuration = req.body.withdrawDuration;
        }

        try {
            const duration = parseInt(await req.solution.getRewardPollDuration(), 10);

            if (req.assetPool.bypassPolls && duration === 0) {
                try {
                    const tx = await (
                        await req.solution.updateReward(req.params.id, withdrawAmount, withdrawDuration)
                    ).wait();

                    const logs = await parseLogs(IDefaultDiamondArtifact.abi, tx.logs);
                    const event = logs.filter((e: { name: string }) => e && e.name === 'RewardPollCreated')[0];
                    const id = parseInt(event.args.rewardID, 10);
                    const pollId = parseInt(event.args.id, 10);

                    try {
                        const tx = await (await req.solution.rewardPollFinalize(pollId)).wait();

                        try {
                            const logs = await parseLogs(IDefaultDiamondArtifact.abi, tx.logs);
                            const event = logs.filter((e: { name: string }) => e && e.name === 'RewardPollUpdated')[0];
                            const withdrawAmount = Number(formatEther(event.args.amount));
                            const withdrawDuration = parseInt(event.args.duration, 10);

                            if (event) {
                                const reward = await Reward.findOne({
                                    id: req.params.id,
                                    poolAddress: req.solution.address,
                                });

                                reward.withdrawAmount = withdrawAmount;
                                reward.withdrawDuration = withdrawDuration;
                                reward.state = 1;

                                await reward.save();
                            }

                            try {
                                res.json(await getRewardData(req.solution, id));
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
