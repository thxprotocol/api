import { Request, Response, NextFunction } from 'express';
import { solutionContract, rewardPollContract } from '../../util/network';
import { Reward, RewardDocument } from '../../models/Reward';
import { ethers } from 'ethers';
import { HttpError } from '../../models/Error';

/**
 * @swagger
 * /rewards/:id/:
 *   get:
 *     tags:
 *       - Rewards
 *     description: Get information about a reward in the asset pool
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
 *     responses:
 *       '200':
 *         schema:
 *           type: object
 *           properties:
 *             id:
 *               type: number
 *               description: Unique identifier of the reward.
 *             title:
 *               type: string
 *               description:
 *             description:
 *               type: string
 *               description: The description
 *             withdrawAmount:
 *               type: number
 *               description: Current size of the reward
 *             withdrawDuration:
 *               type: number
 *               description: Current duration of the withdraw poll
 *             state:
 *               type: number
 *               description: Current state of the reward [Enabled, Disabled]
 *             poll:
 *               type: object
 *               properties:
 *                  address:
 *                      type: string
 *                      description: Address of the reward poll
 *                  withdrawAmount:
 *                      type: number
 *                      description: Proposed size of the reward
 *                  withdrawDuration:
 *                      type: number
 *                      description: Proposed duration of the withdraw poll
 *       '302':
 *          description: Redirect to `GET /rewards/:id`
 *          headers:
 *             Location:
 *                type: string
 *       '400':
 *         description: Bad Request. Indicates incorrect body parameters.
 *       '401':
 *         description: Unauthorized. Authenticate your request please.
 *       '403':
 *         description: Forbidden. Your account does not have access to this pool.
 *       '404':
 *         description: Not Found. Reward not found for this asset pool.
 *       '500':
 *         description: Internal Server Error.
 *       '502':
 *         description: Bad Gateway. Received an invalid response from the network or database.
 */
export const getReward = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const metaData = await Reward.findOne({ id: req.params.id });

        try {
            const instance = solutionContract(req.header('AssetPool'));
            const { id, withdrawAmount, withdrawDuration, state, poll } = await instance.rewards(req.params.id);
            const pollInstance = rewardPollContract(poll);

            const reward = {
                id: id.toNumber(),
                title: metaData.title,
                description: metaData.description,
                withdrawAmount: withdrawAmount,
                withdrawDuration: withdrawDuration.toNumber(),
                state,
                poll:
                    ethers.utils.isAddress(poll) && poll !== '0x0000000000000000000000000000000000000000'
                        ? {
                              address: poll,
                              withdrawAmount: await pollInstance.withdrawAmount(),
                              withdrawDuration: (await pollInstance.withdrawDuration()).toNumber(),
                          }
                        : null,
            } as RewardDocument;

            res.json(reward);
        } catch (err) {
            next(new HttpError(404, 'Asset Pool get reward failed.', err));
            return;
        }
    } catch (err) {
        next(new HttpError(502, 'Reward not found.', err));
    }
};
