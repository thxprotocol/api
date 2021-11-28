import { Response, NextFunction } from 'express';
import { HttpError, HttpRequest } from '../../models/Error';
import { VERSION } from '../../util/secrets';
import { toWei } from 'web3-utils';
import RewardService from '../../services/RewardService';
import AssetPoolService from '../../services/AssetPoolService';
import { RewardDocument } from '../../models/Reward';

// enum ChannelType {
//     None = 0,
//     Google = 1,
// }

// enum ChannelAction {
//     None = 0,
//     Like = 1,
// }

export const postReward = async (req: HttpRequest, res: Response, next: NextFunction) => {
    async function createReward(withdrawAmount: any, withdrawDuration: number) {
        const { reward, error } = await RewardService.create(req.assetPool, withdrawAmount, withdrawDuration);
        if (error) {
            throw new Error(error.message);
        }
        return { reward };
    }

    async function canBypassRewardPoll() {
        const { canBypassPoll, error } = await AssetPoolService.canBypassRewardPoll(req.assetPool);
        if (error) {
            throw new Error(error.message);
        }
        return canBypassPoll;
    }

    async function finalizeRewardPoll(reward: RewardDocument) {
        const { error } = await RewardService.finalizePoll(req.assetPool, reward);
        if (error) {
            throw new Error(error.message);
        }
    }

    try {
        // MOCK
        // req.body.channelType = ChannelType.Google;
        // req.body.channelAction = ChannelAction.Like;
        // req.body.channelItem = 'loremipsum';
        // ENDMOCK

        const withdrawAmount = toWei(req.body.withdrawAmount.toString());
        const withdrawDuration = req.body.withdrawDuration;
        // const condition = {
        //     channel: req.body.channelType,
        //     action: req.body.channelAction,
        //     item: req.body.channelItem,
        // };
        const { reward } = await createReward(withdrawAmount, withdrawDuration);

        if (await canBypassRewardPoll()) {
            await finalizeRewardPoll(reward);
        }

        res.redirect(`/${VERSION}/rewards/${reward.id}`);
    } catch (error) {
        return next(new HttpError(502, error.message, error));
    }
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
