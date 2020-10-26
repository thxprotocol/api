import { Request, Response, NextFunction } from 'express';
import { assetPoolContract, options, rewardPollContract } from '../util/network';
import { Reward, RewardDocument } from '../models/Reward';
import logger from '../util/logger';
import '../config/passport';
import { validationResult } from 'express-validator';

const qrcode = require('qrcode');

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
 *       200:
 *         schema:
 *           type: object
 *           properties:
 *             title:
 *               type: string
 *               description:
 *             description:
 *               type: string
 *               description: The description
 *             withdrawAmount:
 *               type: number
 *               description: Size of the reward
 *             withdrawDuration:
 *               type: number
 *               description: Default duration of the withdraw poll
 */
export const getReward = async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json(errors.array()).end();
    }

    try {
        const metaData = await Reward.findOne({ id: req.params.id });

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
            const finalized = await rewardPollInstance.methods.finalized().call(options);
            const reward = {
                id,
                title: metaData.title,
                description: metaData.description,
                withdrawAmount,
                withdrawDuration,
                state,
                poll: {
                    address: poll,
                    finalized,
                    withdrawAmount: proposal.withdrawAmount,
                    withdrawDuration: proposal.withdrawDuration,
                },
                updated,
            } as RewardDocument;

            res.json(reward);
        } catch (err) {
            logger.error(err.toString());
            res.status(404).json({ msg: err.toString() });
        }
    } catch (err) {
        logger.error(err.toString());
        res.status(500).json({ msg: err.toString() });
    }
};

/**
 * @swagger
 * /rewards:
 *   post:
 *     tags:
 *       - Rewards
 *     description: Create a new reward in the asset pool
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: AssetPool
 *         in: header
 *         required: true
 *         type: string
 *       - name: title
 *         in: body
 *         required: true
 *         type: string
 *       - name: description
 *         in: body
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
 *       302:
 *          headers:
 *              Location:
 *                  type: string
 *                  description: Redirect route to /reward/:id
 */
export const postReward = async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json(errors.array()).end();
    }

    try {
        const poolInstance = assetPoolContract(req.header('AssetPool'));
        const tx = await poolInstance.methods
            .addReward(req.body.withdrawAmount, req.body.withdrawDuration)
            .send(options);
        const id = tx.events.RewardPollCreated.returnValues.id;

        new Reward({
            id,
            title: req.body.title,
            description: req.body.description,
        }).save(async (err) => {
            if (err) {
                throw new Error('Reward not saved');
            }

            res.redirect('rewards/' + id);
        });
    } catch (err) {
        logger.error(err.toString());
        res.status(500).json({ msg: err.toString() });
    }
};

/**
 * @swagger
 * /rewards/:id/claim:
 *   get:
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
 *       200:
 *         base64: data:image/jpeg;base64,...
 */
export const getRewardClaim = async (req: Request, res: Response) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        res.status(400).json(errors.array()).end();
    }

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
        res.status(200).json({ base64 });
    } catch (err) {
        logger.error(err);
        res.status(500).end();
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
 *       302:
 *         description: OK
 */
export const postRewardClaim = async (req: Request, res: Response) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        res.status(400).json(errors.array()).end();
    }

    try {
        const tx = await assetPoolContract(req.header('AssetPool')).methods.claimWithdraw(req.params.id).send(options);
        const pollAddress = tx.events.WithdrawPollCreated.returnValues.poll;

        res.redirect(`withdrawals/${pollAddress}`);
    } catch (err) {
        logger.error(err.toString());
        res.status(500).json({ msg: err.toString() });
    }
};

/**
 * @swagger
 * /rewards/:id/give:
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
 *       - name: member
 *         in: body
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         base64: data:image/jpeg;base64,...
 */
export const postRewardGive = async (req: Request, res: Response) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        res.status(400).json(errors.array()).end();
    }

    try {
        const assetPoolInstance = assetPoolContract(req.header('AssetPool'));
        const tx = assetPoolInstance.methods.giveReward(req.body.member).send(options);
        const withdrawPoll = tx.events.WithdrawPollCreated.returnValues.poll;

        res.json({ withdrawPoll });
    } catch (err) {
        logger.error(err.toString());
        res.status(500).json({ msg: err.toString() });
    }
};

/**
 * @swagger
 * /rewards/:id:
 *   patch:
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
 *       - name: title
 *         in: body
 *         required: true
 *         type: string
 *       - name: description
 *         in: body
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
 *       200:
 *         base64: data:image/jpeg;base64,...
 */
export const patchReward = async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(500).json(errors.array()).end();
    }

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
        logger.error(err.toString());
        res.status(500).json({ msg: err.toString() });
    }
};
