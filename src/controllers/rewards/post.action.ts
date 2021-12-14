import { Response, NextFunction } from 'express';
import { HttpError, HttpRequest } from '../../models/Error';
import { VERSION } from '../../util/secrets';
import { toWei } from 'web3-utils';
import RewardService from '../../services/RewardService';
import AssetPoolService from '../../services/AssetPoolService';
import { RewardDocument, IRewardCondition } from '../../models/Reward';

const ERROR_CREATE_REWARD_FAILED = 'Could not create your reward';
const ERROR_FINALIZE_REWARD_POLL_FAILED = 'Could not finalize your reward poll';
const ERROR_BYPASS_POLL_CHECK_FAILED = 'Could not check your governance setting';
const ERROR_NO_REWARD = 'Could not find a created reward';

export const postReward = async (req: HttpRequest, res: Response, next: NextFunction) => {
    async function createReward(
        withdrawAmount: any,
        withdrawDuration: number,
        condition: IRewardCondition,
        isMembershipRequired: boolean,
        isClaimOnce: boolean,
    ) {
        const { reward, error } = await RewardService.create(
            req.assetPool,
            withdrawAmount,
            withdrawDuration,
            condition,
            isMembershipRequired,
            isClaimOnce,
        );

        if (error) return next(new HttpError(500, ERROR_CREATE_REWARD_FAILED, error));

        return reward;
    }

    async function canBypassRewardPoll() {
        const { canBypassPoll, error } = await AssetPoolService.canBypassRewardPoll(req.assetPool);

        if (error) return next(new HttpError(500, ERROR_BYPASS_POLL_CHECK_FAILED, error));

        return canBypassPoll;
    }

    async function finalizeRewardPoll(reward: RewardDocument) {
        const { error } = await RewardService.finalizePoll(req.assetPool, reward);
        if (error) return next(new HttpError(500, ERROR_FINALIZE_REWARD_POLL_FAILED, error));
    }

    const withdrawAmount = toWei(req.body.withdrawAmount.toString());
    const withdrawDuration = req.body.withdrawDuration;
    const withdrawCondition = req.body.condition;
    const isMembershipRequired = req.body.isMembershipRequired;
    const isClaimOnce = req.body.isClaimOnce;
    const reward = await createReward(
        withdrawAmount,
        withdrawDuration,
        withdrawCondition,
        isMembershipRequired,
        isClaimOnce,
    );

    if (!reward) return next(new HttpError(500, ERROR_NO_REWARD));
    if (await canBypassRewardPoll()) await finalizeRewardPoll(reward);

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
