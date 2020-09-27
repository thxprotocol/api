import { WithdrawState } from '../models/Withdraw';
import { Request, Response, NextFunction } from 'express';
import '../config/passport';
import { assetPoolContract, from, rewardContract } from '../util/network';
import logger from '../util/logger';

/**
 * Get a reward
 * @route GET /withdrawals/:address
 */
export const getWithdrawal = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const reward = rewardContract(req.params.address);

        const beneficiary = await reward.methods.beneficiary().call({ from });
        const amount = await reward.methods.amount().call({ from });
        const state = await reward.methods.state().call({ from });

        res.send({ reward: req.params.address, beneficiary, amount, state: WithdrawState[state] });
    } catch (err) {
        logger.error(err);
        return res.status(404).end();
    }
};

/**
 * Get a reward
 * @route GET /withdrawals/
 */
export const getWithdrawals = async (req: Request, res: Response, next: NextFunction) => {
    const poolAddress = req.header('AssetPool');
    const assetPool = assetPoolContract(poolAddress);
    const withdrawalCount = parseInt(await assetPool.methods.getWithdrawCount().call({ from }), 10);

    try {
        let withdrawals = [];

        for (let i = 0; i < withdrawalCount; i++) {
            const reward = await assetPool.methods.rewards(i).call({ from });
            withdrawals.push(reward);
        }

        res.send({ withdrawals });
    } catch (err) {
        logger.error(err);
        return res.status(404).end();
    }
};

/**
 * Create a reward
 * @route POST /withdrawals/
 */
export const postWithdrawal = async (req: Request, res: Response, next: NextFunction) => {
    const contract = assetPoolContract(req.header('AssetPool'));

    try {
        const tx = await contract.methods
            .proposeWithdraw(req.body.amount.toString(), req.body.beneficiary)
            .send({ from });

        res.status(200).send({ reward: tx.events.WithdrawPollCreated.returnValues.reward });
    } catch (err) {
        logger.error(err);
        return res.status(500).end();
    }
};
