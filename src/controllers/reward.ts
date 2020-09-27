import { Request, Response, NextFunction } from 'express';
import { assetPoolContract, ownerAccount } from '../util/network';
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
    const address = req.header('AssetPool');

    handleValidation(req, res);

    Reward.findOne({ id: req.params.id }, async (err, metaData) => {
        if (err) {
            return next(err);
        }

        if (metaData) {
            const from = ownerAccount().address;
            const assetPoolInstance = assetPoolContract(address);
            const { id, amount, state, poll, updated } = await assetPoolInstance.methods
                .rewardRules(req.params.id)
                .call({ from });
            const reward = {
                id,
                title: metaData.title,
                description: metaData.description,
                amount,
                state,
                poll,
                updated,
            } as RewardDocument;

            return res.status(200).send(reward);
        } else {
            return res.status(404).send({ msg: 'Reward not found in database' });
        }
    });
};

/**
 * Create a reward
 * @route POST /rewards
 */
export const postReward = async (req: Request, res: Response, next: NextFunction) => {
    const address = req.header('AssetPool');

    handleValidation(req, res);

    try {
        const from = ownerAccount().address;
        const contract = assetPoolContract(address);
        const tx = await contract.methods.addRewardRule(req.body.amount).send({ from });

        if (tx) {
            const id = tx.events.RewardRulePollCreated.returnValues.id;
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

                return res.send({ id });
            });
        }
    } catch (err) {
        return res.status(500).send({ msg: 'Reward not added', err });
    }
};

/**
 * Create a reward
 * @route GET /rewards/:id/claim
 */
export const getRewardClaim = async (req: Request, res: Response) => {
    const address = req.header('AssetPool');

    handleValidation(req, res);

    try {
        const base64 = await qrcode.toDataURL(
            JSON.stringify({
                asset_pool: address,
                reward_id: req.params.id,
            }),
        );

        res.status(200).send({ base64 });
    } catch (err) {
        logger.error(err);
        return res.status(500).end();
    }
};

export const updateReward = async (req: Request, res: Response, next: NextFunction) => {};
