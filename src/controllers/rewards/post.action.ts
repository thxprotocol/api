import { Response, NextFunction } from 'express';
import { Reward } from '../../models/Reward';
import { HttpError, HttpRequest } from '../../models/Error';
import { VERSION } from '../../util/secrets';
import IDefaultDiamondArtifact from '../../../src/artifacts/contracts/contracts/IDefaultDiamond.sol/IDefaultDiamond.json';

import { parseLogs } from '../../util/events';
import { parseEther } from 'ethers/lib/utils';
import { Http } from 'winston/lib/winston/transports';
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
        const withdrawAmount = parseEther(req.body.withdrawAmount.toString());
        const tx = await (await req.solution.addReward(withdrawAmount, req.body.withdrawDuration)).wait();

        try {
            const logs = await parseLogs(IDefaultDiamondArtifact.abi, tx.logs);
            const event = logs.filter((e: { name: string }) => e && e.name === 'RewardPollCreated')[0];
            const id = parseInt(event.args.rewardID, 10);
            const pollId = parseInt(event.args.id, 10);

            try {
                const reward = new Reward({
                    id,
                    poolAddress: req.solution.address,
                    withdrawAmount: req.solution.withdrawAmount,
                    withdrawDuration: req.solution.withdrawDuration,
                    state: 0,
                });

                await reward.save();

                if (req.assetPool.bypassPolls) {
                    try {
                        await (await req.solution.rewardPollFinalize(pollId)).wait();

                        try {
                            const event = logs.filter((e: { name: string }) => e && e.name === 'RewardPollEnabled')[0];

                            if (event) {
                                reward.state = 1;
                                await reward.update();
                            }

                            res.redirect(`/${VERSION}/rewards/${id}`);
                        } catch (err) {
                            return next(new HttpError(502, 'Could not parse the transaction event logs.', err));
                        }
                    } catch (e) {
                        return next(new HttpError(502, 'Could not finalize the reward.'));
                    }
                } else {
                    res.redirect(`/${VERSION}/rewards/${id}`);
                }
            } catch (e) {
                return next(new HttpError(502, 'Could not store the reward in the database.', e));
            }
        } catch (err) {
            return next(new HttpError(502, 'Could not parse the transaction event logs.', err));
        }
    } catch (err) {
        return next(new HttpError(502, 'Could not add the reward to the asset pool contract.', err));
    }
};
