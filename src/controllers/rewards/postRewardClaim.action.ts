import RewardService from '../../services/RewardService';
import MemberService from '../../services/MemberService';
import AccountService from '../../services/AccountService';
import WithdrawalService from '../../services/WithdrawalService';

import { Response, NextFunction } from 'express';
import { HttpError, HttpRequest } from '../../models/Error';

const ERROR_REWARD_NOT_FOUND = 'The reward for this ID does not exist.';
const ERROR_ACCOUNT_NO_ADDRESS = 'The authenticated account has not wallet address. Sign in the Web Wallet once.';
const ERROR_REWARD_ALREADY_CLAIMED = 'Reward already claimed for this address.';

export const postRewardClaim = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        const rewardId = Number(req.params.id);
        const { reward, error } = await RewardService.get(req.assetPool.address, rewardId);

        if (error) {
            throw new Error(error);
        } else {
            if (!reward) {
                throw new Error(ERROR_REWARD_NOT_FOUND);
            }

            const account = await AccountService.get(req.user.sub);

            if (!account.address) {
                throw new Error(ERROR_ACCOUNT_NO_ADDRESS);
            }

            const { isMember, error } = await MemberService.isMember(req.assetPool, account.address);

            if (error) {
                throw new Error(error);
            } else {
                if (!isMember) {
                    const { error } = await MemberService.addMember(req.assetPool, account.address);

                    if (error) {
                        throw new Error(error);
                    } else {
                        const { error } = await AccountService.addMembershipForAddress(req.assetPool, account.address);

                        if (error) {
                            throw new Error(error);
                        }
                    }
                }
                const { canClaim, error } = await RewardService.canClaim(reward, account.address);

                if (error) {
                    throw new Error(error);
                }

                if (!canClaim) {
                    throw new Error(ERROR_REWARD_ALREADY_CLAIMED);
                }

                try {
                    const { withdrawal, error } = await RewardService.claimRewardForOnce(
                        req.assetPool,
                        Number(req.params.id),
                        account.address,
                    );

                    if (error) {
                        throw new Error('ClaimRewardForOnce failed');
                    }

                    if (!withdrawal) {
                        throw new Error('No withdrawal found failed');
                    }

                    if (req.assetPool.bypassPolls) {
                        const { error } = await WithdrawalService.withdrawPollFinalize(req.assetPool, withdrawal.id);

                        if (error) {
                            throw new Error(error);
                        }
                    }

                    res.status(200).end();
                } catch (error) {
                    next(new HttpError(500, error.toString(), error));
                }
            }
        }
    } catch (error) {
        next(new HttpError(500, error.toString(), error));
    }
};

/**
 * @swagger
 * /rewards/:id/claim:
 *   post:
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
