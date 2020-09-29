import { Request, Response, NextFunction } from 'express';
import { assetPoolContract, options } from '../util/network';
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

    Reward.findOne({ id: req.params.id }, async (err, metaData) => {
        if (err) {
            return next(err);
        }

        if (metaData) {
            const { id, amount, state, poll, updated } = await assetPoolContract(req.header('AssetPool'))
                .methods.rewards(req.params.id)
                .call(options);
            const reward = {
                id,
                title: metaData.title,
                description: metaData.description,
                amount,
                state,
                poll,
                updated,
            } as RewardDocument;

            return res.send({ reward });
        } else {
            logger.error(err);
            return res.status(404).send({ msg: 'Reward not found in database' });
        }
    });
};

/**
 * Create a reward
 * @route POST /rewards
 */
export const postReward = async (req: Request, res: Response, next: NextFunction) => {
    handleValidation(req, res);

    try {
        const tx = await assetPoolContract(req.header('AssetPool')).methods.addReward(req.body.amount).send(options);

        if (tx) {
            const id = tx.events.RewardPollCreated.returnValues.id;
            const reward = new Reward({
                id,
                title: req.body.title,
                description: req.body.description,
            });

            reward.save(async (err) => {
                if (err) {
                    res.send({ msg: 'Reward not saved', err });
                    return next(err);
                }

                res.redirect('/v1/rewards/' + id);
            });
        }
    } catch (err) {
        logger.error(err);
        return res.status(500).send({ msg: 'Reward not added', err });
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
 * Update a reward
 * @route PUT /rewards/:id
 */
export const putReward = async (req: Request, res: Response, next: NextFunction) => {
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

            const { amount } = await assetPoolContract(req.header('AssetPool'))
                .methods.rewards(req.params.id)
                .call(options);

            if (amount !== req.body.amount) {
                const base64 = await qrcode.toDataURL(
                    JSON.stringify({
                        contractAddress: req.header('AssetPool'),
                        contract: 'AssetPool',
                        method: 'updateReward',
                        params: {
                            id: req.params.id,
                            amount: req.params.amount,
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
