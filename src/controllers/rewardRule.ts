import { AccountDocument } from '../models/Account';
import { Request, Response, NextFunction } from 'express';
import { check, validationResult } from 'express-validator';
import { rewardPoolContract, ownerAccount } from '../util/network';
import { RewardRule, RewardRuleDocument } from '../models/RewardRule';
import '../config/passport';

/**
 * Get a rewardRule
 * @route GET /rewardrule/:id
 */
export const getRewardRule = async (req: Request, res: Response, next: NextFunction) => {
    const uid = req.session.passport.user;
    const address = req.header('RewardPool');

    check(uid, 'The UID for this session is not found.').exists();
    check(address, 'RewardPool unavailable to this account').isIn((req.user as AccountDocument).profile.rewardPools);

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).send(errors.array());
    }

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
    const poolAddress = req.header('RewardPool');

    check(poolAddress, 'You do not have access to this Reward Pool').isIn(
        (req.user as AccountDocument).profile.rewardPools,
    );

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.send(errors.array());
    }

    try {
        const from = ownerAccount().address;
        const contract = rewardPoolContract(poolAddress);
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

export const updateRewardRule = async (req: Request, res: Response, next: NextFunction) => {};
