import { Request, Response, NextFunction } from 'express';
import {
    assetPoolContract,
    ASSET_POOL,
    gasStation,
    parseLogs,
    parseResultLog,
    rewardPollContract,
} from '../util/network';
import { Reward, RewardDocument } from '../models/Reward';
import { ethers } from 'ethers';
import { HttpError } from '../models/Error';
import { VERSION } from '../util/secrets';
import qrcode from 'qrcode';
import '../config/passport';

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
 *       '200':
 *         schema:
 *           type: object
 *           properties:
 *             id:
 *               type: number
 *               description: Unique identifier of the reward.
 *             title:
 *               type: string
 *               description:
 *             description:
 *               type: string
 *               description: The description
 *             withdrawAmount:
 *               type: number
 *               description: Current size of the reward
 *             withdrawDuration:
 *               type: number
 *               description: Current duration of the withdraw poll
 *             state:
 *               type: number
 *               description: Current state of the reward [Enabled, Disabled]
 *             poll:
 *               type: object
 *               properties:
 *                  address:
 *                      type: string
 *                      description: Address of the reward poll
 *                  withdrawAmount:
 *                      type: number
 *                      description: Proposed size of the reward
 *                  withdrawDuration:
 *                      type: number
 *                      description: Proposed duration of the withdraw poll
 *       '302':
 *          description: Redirect to `GET /rewards/:id`
 *          headers:
 *             Location:
 *                type: string
 *       '400':
 *         description: Bad Request. Indicates incorrect body parameters.
 *       '401':
 *         description: Unauthorized. Authenticate your request please.
 *       '403':
 *         description: Forbidden. Your account does not have access to this pool.
 *       '404':
 *         description: Not Found. Reward not found for this asset pool.
 *       '500':
 *         description: Internal Server Error.
 *       '502':
 *         description: Bad Gateway. Received an invalid response from the network or database.
 */
export const getReward = async (req: Request, res: Response, next: NextFunction) => {
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
                withdrawAmount: withdrawAmount,
                withdrawDuration: withdrawDuration.toNumber(),
                state,
                poll:
                    ethers.utils.isAddress(poll) && poll !== '0x0000000000000000000000000000000000000000'
                        ? {
                              address: poll,
                              withdrawAmount: await pollInstance.withdrawAmount(),
                              withdrawDuration: (await pollInstance.withdrawDuration()).toNumber(),
                          }
                        : null,
            } as RewardDocument;

            res.json(reward);
        } catch (err) {
            next(new HttpError(404, 'Asset Pool get reward failed.', err));
            return;
        }
    } catch (err) {
        next(new HttpError(502, 'Reward not found.', err));
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
 *       '200':
 *          description: OK
 *       '302':
 *          headers:
 *              Location:
 *                  type: string
 *                  description: Redirect route to /reward/:id
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
export const postReward = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const poolInstance = assetPoolContract(req.header('AssetPool'));
        const tx = await (await poolInstance.addReward(req.body.withdrawAmount, req.body.withdrawDuration)).wait();

        try {
            const events = await parseLogs(ASSET_POOL.abi, tx.logs);
            const event = events.filter((e: { name: string }) => e.name === 'RewardPollCreated')[0];
            const id = parseInt(event.args.id, 10);

            new Reward({
                id,
                title: req.body.title,
                description: req.body.description,
            }).save(async (err) => {
                if (err) {
                    next(new HttpError(502, 'Reward save failed.', err));
                    return;
                }

                res.redirect(`/${VERSION}/rewards/${id}`);
            });
        } catch (err) {
            next(new HttpError(502, 'Parse logs failed.', err));
            return;
        }
    } catch (err) {
        next(new HttpError(502, 'Asset Pool addReward failed.', err));
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
export const getRewardClaim = async (req: Request, res: Response, next: NextFunction) => {
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
        res.json({ base64 });
    } catch (err) {
        next(new HttpError(502, 'Gas Station call failed.', err));
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
 *       '302':
 *          description: Redirect to `GET /members/:address`
 *          headers:
 *             Location:
 *                type: string
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
export const postRewardClaim = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tx = await (
            await gasStation.call(req.body.call, req.header('AssetPool'), req.body.nonce, req.body.sig)
        ).wait();

        try {
            const { error, logs } = await parseResultLog(ASSET_POOL.abi, tx.logs);

            if (error) {
                throw error;
            }

            const event = logs.filter((e: { name: string }) => e.name === 'WithdrawPollCreated')[0];
            const pollAddress = event.args.poll;

            res.redirect(`/${VERSION}/withdrawals/${pollAddress}`);
        } catch (error) {
            next(new HttpError(500, 'Parse logs failed.', error));
            return;
        }
    } catch (err) {
        next(new HttpError(502, 'Gas Station call failed.', err));
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
 *       '200':
 *         description: OK
 *         schema:
 *            type: object
 *            properties:
 *               withdrawPoll:
 *                  type: string
 *                  description: Address off the withdraw poll
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
export const postRewardGive = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const assetPoolInstance = assetPoolContract(req.header('AssetPool'));
        const tx = await assetPoolInstance.giveReward(req.body.member).wait();

        try {
            const { error, logs } = await parseResultLog(ASSET_POOL.abi, tx.logs);

            if (error) {
                next(new HttpError(502, 'Asset Pool giveReward failed.', new Error(error)));
                return;
            }

            const event = logs.filter((e: { name: string }) => e.name === 'WithdrawPollCreated')[0];
            const withdrawPoll = event.args.poll;

            res.json({ withdrawPoll });
        } catch (err) {
            next(new HttpError(500, 'Parse logs failed.', err));
            return;
        }
    } catch (err) {
        next(new HttpError(502, 'Gas Station call failed.', err));
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
export const patchReward = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const metaData = await Reward.findOne({ id: req.params.id });

        if (!req.body.title || req.body.title !== metaData.title) {
            metaData.title = req.body.title;
        }

        if (!req.body.description || req.body.description !== metaData.description) {
            metaData.description = req.body.description;
        }

        try {
            metaData.save(async (err) => {
                if (err) {
                    next(new HttpError(502, 'Reward metadata find failed.', err));
                    return;
                }

                try {
                    const instance = assetPoolContract(req.header('AssetPool'));
                    let { withdrawAmount, withdrawDuration } = await instance.rewards(req.params.id);

                    if (req.body.withdrawAmount && withdrawAmount !== req.body.withdrawAmount) {
                        withdrawAmount = req.body.withdrawAmount;
                    }

                    if (req.body.withdrawDuration && withdrawDuration !== req.body.withdrawDuration) {
                        withdrawDuration = req.body.withdrawDuration;
                    }

                    const base64 = await qrcode.toDataURL(
                        JSON.stringify({
                            contractAddress: req.header('AssetPool'),
                            contract: 'AssetPool',
                            method: 'updateReward',
                            params: {
                                id: req.params.id,
                                withdrawAmount,
                                withdrawDuration,
                            },
                        }),
                    );
                    res.json({ base64 });
                } catch (error) {
                    next(new HttpError(502, 'Asset Pool get reward failed.', err));
                    return;
                }
            });
        } catch (error) {
            next(new HttpError(502, 'Reward metadata save failed.', error));
            return;
        }
    } catch (error) {
        next(new HttpError(502, 'Reward find failed.', error));
    }
};
