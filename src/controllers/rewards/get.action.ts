import { Request, Response, NextFunction } from 'express';
import RewardService from '@/services/RewardService';
import { HttpError } from '@/models/Error';

export const getRewards = async (req: Request, res: Response, next: NextFunction) => {
    async function getReward(rewardId: number) {
        const { reward, error } = await RewardService.get(req.assetPool, rewardId);
        if (error) {
            throw new Error(error.message);
        }
        return reward;
    }

    try {
        const rewards = [];
        let rewardId = 1;
        while (rewardId >= 1) {
            try {
                const reward = await getReward(rewardId);
                if (reward) {
                    rewards.push(reward);
                    rewardId++;
                } else {
                    break;
                }
            } catch (e) {
                break;
            }
        }
        res.json(rewards);
    } catch (error) {
        next(new HttpError(502, error.message, error));
    }
};

/**
 * @swagger
 * /rewards:
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
 *     responses:
 *       '200':
 *         content: application/json
 *         schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: number
 *                     description: Unique identifier of the reward.
 *                   withdrawAmount:
 *                     type: number
 *                     description: Current size of the reward
 *                   withdrawDuration:
 *                     type: number
 *                     description: Current duration of the withdraw poll
 *                   state:
 *                     type: number
 *                     description: Current state of the reward [Disabled, Enabled]
 *                   poll:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: number
 *                         description: Unique identifier of the reward poll
 *                       withdrawAmount:
 *                         type: number
 *                         description: Proposed size of the reward
 *                       withdrawDuration:
 *                         type: number
 *                         description: Proposed duration of the withdraw poll
 *       '400':
 *         $ref: '#/components/responses/400'
 *       '401':
 *         $ref: '#/components/responses/401'
 *       '403':
 *         description: Forbidden. Your account does not have access to this pool.
 *       '404':
 *         description: Not Found. Reward not found for this asset pool.
 *       '500':
 *         $ref: '#/components/responses/500'
 *       '502':
 *         $ref: '#/components/responses/502'
 */
