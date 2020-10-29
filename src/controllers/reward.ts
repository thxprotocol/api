import { Request, Response, NextFunction } from 'express';
import {
    assetPoolContract,
    ASSET_POOL,
    gasStation,
    GAS_STATION,
    parseLogs,
    parseResultLog,
    rewardPollContract,
} from '../util/network';
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
            const instance = assetPoolContract(req.header('AssetPool'));
            const { id, withdrawAmount, withdrawDuration, state, poll } = await instance.rewards(req.params.id);
            const pollInstance = rewardPollContract(poll);
            const reward = {
                id: id.toNumber(),
                title: metaData.title,
                description: metaData.description,
                withdrawAmount: withdrawAmount.toNumber(),
                withdrawDuration: withdrawDuration.toNumber(),
                state,
                poll:
                    poll !== '0x0000000000000000000000000000000000000000'
                        ? {
                              address: poll,
                              withdrawAmount: (await pollInstance.withdrawAmount()).toNumber(),
                              withdrawDuration: (await pollInstance.withdrawDuration()).toNumber(),
                          }
                        : null,
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
        const tx = await (await poolInstance.addReward(req.body.withdrawAmount, req.body.withdrawDuration)).wait();
        const events = await parseLogs(ASSET_POOL.abi, tx.logs);
        const event = events.filter((e: { name: string }) => e.name === 'RewardPollCreated')[0];
        const id = parseInt(event.args.id, 10);

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
        let tx = await gasStation.call(req.body.call, req.header('AssetPool'), req.body.nonce, req.body.sig);
        tx = await tx.wait();

        const events = await parseResultLog(ASSET_POOL.abi, tx.logs);
        const event = events.filter((e: { name: string }) => e.name === 'WithdrawPollCreated')[0];
        const pollAddress = event.args.poll;

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
        let tx = assetPoolInstance.giveReward(req.body.member);
        tx = await tx.wait();

        const events = await parseResultLog(ASSET_POOL.abi, tx.logs);
        const event = events.filter((e: { name: string }) => e.name === 'WithdrawPollCreated')[0];
        const withdrawPoll = event.args.poll;

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

            const instance = assetPoolContract(req.header('AssetPool'));
            const { withdrawAmount, withdrawDuration } = await instance.rewards(req.params.id);

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
