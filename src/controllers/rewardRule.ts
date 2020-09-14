import { Request, Response, NextFunction } from 'express';
import { rewardPoolContract, ownerAccount } from '../util/network';
import { RewardRule, RewardRuleDocument } from '../models/RewardRule';
import logger from '../util/logger';
import '../config/passport';
import { handleValidation } from '../util/validation';

const qrcode = require('qrcode');

/**
 * Get a rewardRule
 * @route GET /rewardrule/:id
 */
export const getRewardRule = async (req: Request, res: Response, next: NextFunction) => {
    const address = req.header('RewardPool');

    handleValidation(req, res);

    RewardRule.findOne({ id: req.params.id }, async (err, metaData) => {
        if (err) {
            return next(err);
        }

        if (metaData) {
            const from = ownerAccount().address;
            const rewardPoolInstance = rewardPoolContract(address);
            const { id, amount, state, poll, updated } = await rewardPoolInstance.methods
                .rewardRules(req.params.id)
                .call({ from });
            const rewardRule = {
                id,
                title: metaData.title,
                description: metaData.description,
                amount,
                state,
                poll,
                updated,
            } as RewardRuleDocument;

            return res.status(200).send(rewardRule);
        } else {
            return res.status(404).send({ msg: 'Reward not found in database' });
        }
    });
};

/**
 * Create a rewardRule
 * @route POST /rewardrule
 */
export const postRewardRule = async (req: Request, res: Response, next: NextFunction) => {
    const address = req.header('RewardPool');

    handleValidation(req, res);

    try {
        const from = ownerAccount().address;
        const contract = rewardPoolContract(address);
        const tx = await contract.methods.addRewardRule(req.body.amount).send({ from });

        if (tx) {
            const id = tx.events.RewardRulePollCreated.returnValues.id;
            const rewardRule = new RewardRule({
                id,
                title: req.body.title,
                description: req.body.description,
            });

            rewardRule.save(async (err) => {
                if (err) {
                    res.send({ msg: 'RewardRule not saved', err });
                    return next(err);
                }

                return res.send({ id });
            });
        }
    } catch (err) {
        return res.status(500).send({ msg: 'RewardRule not added', err });
    }
};

/**
 * Create a reward
 * @route GET /reward_rules/:id/claim
 */
export const getRewardRuleClaim = async (req: Request, res: Response, next: NextFunction) => {
    const address = req.header('RewardPool');

    handleValidation(req, res);

    try {
        const base64 = await qrcode.toDataURL(
            JSON.stringify({
                reward_pool: address,
                reward_rule_id: req.params.id,
            }),
        );

        res.status(200).send({ base64 });
    } catch (err) {
        logger.error(err);
        return res.status(500).end();
    }
};

export const updateRewardRule = async (req: Request, res: Response, next: NextFunction) => {};
