import { RewardState } from '../models/Reward';
import { Request, Response, NextFunction } from 'express';
import '../config/passport';
import { rewardPoolContract, from, rewardContract } from '../util/network';
import logger from '../util/logger';

/**
 * Get a reward
 * @route GET /rewards/:address
 */
export const getReward = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const reward = rewardContract(req.params.address);

        const beneficiary = await reward.methods.beneficiary().call({ from });
        const amount = await reward.methods.amount().call({ from });
        const state = await reward.methods.state().call({ from });

        res.send({ reward: req.params.address, beneficiary, amount, state: RewardState[state] });
    } catch (err) {
        logger.error(err);
        return res.status(404).end();
    }
};

/**
 * Get a reward
 * @route GET /rewards/
 */
export const getRewards = async (req: Request, res: Response, next: NextFunction) => {
    const poolAddress = req.header('RewardPool');
    const rewardPool = rewardPoolContract(poolAddress);
    const rewardCount = parseInt(await rewardPool.methods.getRewardCount().call({ from }), 10);

    try {
        let rewards = [];

        for (let i = 0; i < rewardCount; i++) {
            const reward = await rewardPool.methods.rewards(i).call({ from });
            rewards.push(reward);
        }

        res.send({ rewards });
    } catch (err) {
        logger.error(err);
        return res.status(404).end();
    }
};

/**
 * Create a reward
 * @route POST /reward/
 */
export const postReward = async (req: Request, res: Response, next: NextFunction) => {
    const contract = rewardPoolContract(req.header('RewardPool'));

    try {
        const tx = await contract.methods
            .proposeReward(req.body.amount.toString(), req.body.beneficiary)
            .send({ from });

        res.status(200).send({ reward: tx.events.RewardPollCreated.returnValues.reward });
    } catch (err) {
        logger.error(err);
        return res.status(500).end();
    }
};
