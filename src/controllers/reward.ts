import { Request, Response, NextFunction } from 'express';
import { assetPoolContract, options, rewardPollContract } from '../util/network';
import { Reward, RewardDocument } from '../models/Reward';
import logger from '../util/logger';
import '../config/passport';
import { handleValidation } from '../util/validation';

const qrcode = require('qrcode');

/**
 * Get a reward
 * @route GET /rewards/:id
 */
export const getReward = async (req: Request, res: Response, next: NextFunction) => {
    handleValidation(req, res);

    try {
        Reward.findOne({ id: req.params.id }, async (err, metaData) => {
            if (err) {
                throw new Error('Reward does not exist in database.');
            }

            try {
                const { id, withdrawAmount, withdrawDuration, state, poll, updated } = await assetPoolContract(
                    req.header('AssetPool'),
                )
                    .methods.rewards(req.params.id)
                    .call(options);
                const rewardPollInstance = rewardPollContract(poll);
                const proposal = {
                    withdrawAmount: await rewardPollInstance.methods.withdrawAmount().call(options),
                    withdrawDuration: await rewardPollInstance.methods.withdrawDuration().call(options),
                };

                const reward = {
                    id,
                    title: metaData.title,
                    description: metaData.description,
                    withdrawAmount,
                    withdrawDuration,
                    state,
                    poll: {
                        address: poll,
                        withdrawAmount: proposal.withdrawAmount,
                        withdrawDuration: proposal.withdrawDuration,
                    },
                    updated,
                } as RewardDocument;

                return res.send({ reward });
            } catch (err) {
                throw new Error('Reward does not exists on chain.');
            }
        });
    } catch (err) {
        logger.error(err);
        return res.status(500).end({ msg: err });
    }
};

/**
 * Create a reward
 * @route POST /rewards
 */
export const postReward = async (req: Request, res: Response, next: NextFunction) => {
    handleValidation(req, res);

    try {
        const tx = await assetPoolContract(req.header('AssetPool'))
            .methods.addReward(req.body.withdrawAmount, req.body.withdrawDuration)
            .send(options);

        if (tx.level === 'error') {
            throw new Error('Transaction reverted.');
        }
        const id = tx.events.RewardPollCreated.returnValues.id;
        const reward = new Reward({
            id,
            title: req.body.title,
            description: req.body.description,
        });

        reward.save(async (err) => {
            if (err) {
                throw new Error('Reward not saved');
            }

            res.redirect('/v1/rewards/' + id);
        });
    } catch (err) {
        logger.error(err);
        return res.status(500).end({ msg: err });
    }
};

/**
 * Create a reward
 * @route GET /rewards/:id/claim
 */
export const getRewardClaim = async (req: Request, res: Response) => {
    handleValidation(req, res);
    try {
        const base64 = await qrcode.toDataURL(
            JSON.stringify({
                contractAddress: req.header('AssetPool'),
                contract: 'AssetPool',
                method: 'claimWithdraw', // "claimReward" might be a better name
                params: {
                    reward_id: req.params.id,
                },
            }),
        );
        res.status(200).send({ base64 });
    } catch (err) {
        logger.error(err);
        return res.status(500).end();
    }
};

/**
 * GET QR for updating reward
 * @route GET /rewards/:id/update
 */
export const getRewardUpdate = async (req: Request, res: Response, next: NextFunction) => {
    handleValidation(req, res);
    try {
        const metaData = await Reward.findOne({ id: req.params.id });

        if (!req.body.title || req.body.title !== metaData.title) {
            metaData.title = req.body.title;
        }

        if (!req.body.description || req.body.description !== metaData.description) {
            metaData.description = req.body.description;
        }

        metaData.save(async (err) => {
            if (err) {
                throw Error('Could not find reward in database');
            }

            const { withdrawAmount, withdrawDuration } = await assetPoolContract(req.header('AssetPool'))
                .methods.rewards(req.params.id)
                .call(options);
            console.log(withdrawAmount, withdrawDuration);

            if (withdrawAmount !== req.body.withdrawAmount || withdrawDuration !== req.body.withdrawDuration) {
                const base64 = await qrcode.toDataURL(
                    JSON.stringify({
                        contractAddress: req.header('AssetPool'),
                        contract: 'AssetPool',
                        method: 'updateReward',
                        params: {
                            id: req.params.id,
                            withdrawAmount: req.body.withdrawAmount,
                            withdrawDuration: req.body.withdrawDuration,
                        },
                    }),
                );
                res.send({ base64 });
            } else {
                // TODO this one is not handled
                throw Error('Proposed amount is equal to current amount');
            }
        });
    } catch (err) {
        logger.error(err);
        return res.status(500).end();
    }
};
