import RewardService from '@/services/RewardService';
import { HttpError } from '@/models/Error';
import { Request, NextFunction, Response } from 'express';

export const postPollFinalize = async (req: Request, res: Response, next: NextFunction) => {
    const reward = await RewardService.get(req.assetPool, Number(req.params.id));
    if (!reward) return next(new HttpError(404, 'No reward found for this ID.'));

    const finalizedReward = await RewardService.finalizePoll(req.assetPool, reward);
    res.json(finalizedReward);
};

/**
 * @swagger
 * /rewards/:id/poll/finalize:
 *   post:
 *     tags:
 *       - Rewards
 *     description: Finalizes the reward poll.
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
 *         type: number
 *     responses:
 *       '200':
 *         description: OK
 *         content: application/json
 *         schema:
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
