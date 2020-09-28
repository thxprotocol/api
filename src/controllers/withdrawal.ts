import { WithdrawState } from '../models/Withdraw';
import { Request, Response, NextFunction } from 'express';
import '../config/passport';
import { assetPoolContract, options, withdrawPollContract } from '../util/network';
import logger from '../util/logger';

/**
 * Get a reward
 * @route GET /withdrawals/:address
 */
export const getWithdrawal = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const reward = withdrawPollContract(req.params.address);
        const beneficiary = await reward.methods.beneficiary().call(options);
        const amount = await reward.methods.amount().call(options);
        const state = await reward.methods.state().call(options);

        res.send({ reward: req.params.address, beneficiary, amount, state: WithdrawState[state] });
    } catch (err) {
        logger.error(err);
        return res.status(404).end();
    }
};

/**
 * Get all withdrawals of a member
 * @route GET /withdrawals/:member
 */
export const getWithdrawals = async (req: Request, res: Response) => {
    const assetPool = assetPoolContract(req.header('AssetPool'));
    const withdrawalCount = parseInt(
        await assetPool.methods.getWithdrawPollsCountOf(req.body.member).call(options),
        10,
    );

    try {
        let withdrawPolls = [];

        for (let i = 0; i < withdrawalCount; i++) {
            const withdrawPoll = await assetPool.methods.withdrawalPollsOf(req.body.member, i).call(options);
            withdrawPolls.push(withdrawPoll);
        }

        res.send({ withdrawPolls });
    } catch (err) {
        logger.error(err);
        return res.status(404).end();
    }
};

/**
 * Create a withdrawal
 * @route POST /withdrawals/
 */
export const postWithdrawal = async (req: Request, res: Response) => {
    try {
        const tx = await assetPoolContract(req.header('AssetPool'))
            .methods.proposeWithdraw(req.body.amount.toString(), req.body.beneficiary)
            .send(options);
        const reward = tx.events.WithdrawPollCreated.returnValues.reward;

        return res.send({ reward });
    } catch (err) {
        logger.error(err);
        return res.status(500).end();
    }
};
