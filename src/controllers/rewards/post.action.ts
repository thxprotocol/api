import { Request, Response, NextFunction } from 'express';
import { HttpError } from '@/models/Error';
import { VERSION } from '@/util/secrets';
import { toWei } from 'web3-utils';
import BN from 'bn.js';

import RewardService from '@/services/RewardService';
import AssetPoolService from '@/services/AssetPoolService';

const ERROR_NO_REWARD = 'Could not find a created reward';

export const postReward = async (req: Request, res: Response, next: NextFunction) => {
    const withdrawAmount = toWei(String(req.body.withdrawAmount));
    const withdrawDuration = req.body.withdrawDuration;
    const withdrawCondition = req.body.withdrawCondition;
    const isMembershipRequired = req.body.isMembershipRequired;
    const isClaimOnce = req.body.isClaimOnce;
    const reward = await RewardService.create(
        req.assetPool,
        new BN(withdrawAmount),
        withdrawDuration,
        withdrawCondition,
        isMembershipRequired,
        isClaimOnce,
    );

    if (!reward) return next(new HttpError(500, ERROR_NO_REWARD));

    if (await AssetPoolService.canBypassRewardPoll(req.assetPool))
        await RewardService.finalizePoll(req.assetPool, reward);

    res.redirect(`/${VERSION}/rewards/${reward.id}`);
};

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
