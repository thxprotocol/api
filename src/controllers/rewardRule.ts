import { Account, AccountDocument } from '../models/Account';
import { Reward, RewardDocument } from '../models/Reward';
import { Request, Response, NextFunction } from 'express';
import '../config/passport';
import { check, validationResult } from 'express-validator';
import { RewardPool, rewardPoolContract, ownerAccount } from '../models/RewardPool';
import { RewardRule, RewardRuleDocument } from '../models/RewardRule';

/**
 * Get a rewardRule
 * @route GET /rewardrule/:id
 */
export const getRewardRule = async (req: Request, res: Response, next: NextFunction) => {
    const uid = req.session.passport.user;
    const poolAddress = req.header('RewardPool');
    if (!uid) {
        return res.send({ msg: 'The UID for this session is not found.' });
    }
    await check(poolAddress, 'RewardPool unavailable to this account').isIn(
        (req.user as AccountDocument).profile.rewardPools,
    );

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.send(errors.array());
    }

    RewardRule.findOne({ id: req.params.id }, async (err, metaData) => {
        if (err) {
            return next(err);
        }

        try {
            const rewardPool = new RewardPool(poolAddress);
            const contractData = await rewardPool.findRewardRuleById(req.params.id);
            console.log(metaData);
            const rewardRule = { ...metaData, ...contractData } as RewardRuleDocument;

            return res.send(rewardRule);
        } catch (err) {
            res.send({ msg: 'Reward not found', err });
        }
    });
};

/**
 * Create a rewardRule
 * @route POST /rewardrule
 */
export const postRewardRule = async (req: Request, res: Response, next: NextFunction) => {
    const poolAddress = req.header('RewardPool');

    await check(poolAddress, 'You do not have access to this Reward Pool').isIn(
        (req.user as AccountDocument).profile.rewardPools,
    );

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.send(errors.array());
    }

    try {
        const contract = rewardPoolContract(poolAddress);
        const tx = await contract.methods.addRewardRule(req.body.amount).send({ from: ownerAccount().address });

        return res.status(200).send(tx);
        // if (tx) {
        //     const metaData = new RewardRule({
        //         id: 0,
        //         title: req.body.title,
        //         description: req.body.description,
        //         amount: req.body.amount,
        //     });

        //     metaData.save(async (err) => {
        //         if (err) {
        //             res.send({ msg: 'RewardRule not saved', err });
        //             return next(err);
        //         }

        //         return res.send(tx);
        //     });
        // }
    } catch (err) {
        return res.status(500).send({ msg: 'RewardRule not added', err });
    }
};

export const updateRewardRule = async (req: Request, res: Response, next: NextFunction) => {};
