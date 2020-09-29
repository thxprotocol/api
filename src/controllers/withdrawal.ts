import { WithdrawState } from '../models/Withdraw';
import { Request, Response } from 'express';
import '../config/passport';
import { assetPoolContract, options, withdrawPollContract } from '../util/network';
import logger from '../util/logger';
import { handleValidation } from '../util/validation';
const qrcode = require('qrcode');

/**
 * Get a reward
 * @route GET /withdrawals/:address
 */
export const getWithdrawal = async (req: Request, res: Response) => {
    handleValidation(req, res);
    try {
        const withdrawal = withdrawPollContract(req.params.address);
        const beneficiary = await withdrawal.methods.beneficiary().call(options);
        const amount = await withdrawal.methods.amount().call(options);
        const state = await withdrawal.methods.state().call(options);
        const startTime = await withdrawal.methods.startTime().call(options);
        const endTime = await withdrawal.methods.endTime().call(options);
        const yesCounter = await withdrawal.methods.yesCounter().call(options);
        const noCounter = await withdrawal.methods.noCounter().call(options);
        const totalVoted = await withdrawal.methods.totalVoted().call(options);
        const finalized = await withdrawal.methods.finalized().call(options);

        res.send({
            startTime: new Date(startTime * 1000),
            endTime: new Date(endTime * 1000),
            withdrawal: withdrawal.options.address,
            beneficiary,
            amount,
            state: WithdrawState[state],
            yesCounter,
            noCounter,
            totalVoted,
            finalized,
        });
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
    handleValidation(req, res);
    try {
        const assetPool = assetPoolContract(req.header('AssetPool'));
        const withdrawalCount = parseInt(
            await assetPool.methods.getWithdrawPollsCountOf(req.body.member).call(options),
            10,
        );
        let withdrawPolls = [];

        for (let i = 0; i < withdrawalCount; i++) {
            const withdrawPoll = await assetPool.methods.withdrawalPollsOf(req.body.member, i).call(options);
            withdrawPolls.push(withdrawPoll);
        }

        res.send({ withdrawPolls });
    } catch (err) {
        logger.error(err);
        res.status(404).end();
    }
};

/**
 * Create a withdrawal
 * @route POST /withdrawals/
 */
export const postWithdrawal = async (req: Request, res: Response) => {
    handleValidation(req, res);
    try {
        const tx = await assetPoolContract(req.header('AssetPool'))
            .methods.proposeWithdraw(req.body.amount.toString(), req.body.beneficiary)
            .send(options);
        const reward = tx.events.WithdrawPollCreated.returnValues.reward;

        res.send({ reward });
    } catch (err) {
        logger.error(err);
        res.status(500).end();
    }
};

/**
 * Cast a vote for a withdrawal
 * @route GET /withdrawals/:address/vote/:agree
 */
export const getWithdrawalVote = async (req: Request, res: Response) => {
    handleValidation(req, res);
    try {
        const base64 = await qrcode.toDataURL(
            JSON.stringify({
                contractAddress: req.params.address,
                contract: 'WithdrawPoll',
                method: 'vote',
                params: {
                    agree: !!+req.params.agree,
                },
            }),
        );
        res.send({ base64 });
    } catch (err) {
        logger.error(err);
        return res.status(500).end();
    }
};

/**
 * Cast a vote for a withdrawal
 * @route POST /withdrawals/:address/vote
 */
export const postWithdrawalVote = async (req: Request, res: Response) => {
    handleValidation(req, res);
    try {
        const tx = await withdrawPollContract(req.params.address)
            .methods.vote(req.body.voter, JSON.parse(req.body.agree), parseInt(req.body.nonce, 10), req.body.sig)
            .send(options);
        res.send({ tx });
    } catch (err) {
        logger.error(err);
        return res.status(500).end();
    }
};

/**
 * Cast a vote for a withdrawal
 * @route GET /withdrawals/:address/revoke_vote
 */
export const getWithdrawalRevokeVote = async (req: Request, res: Response) => {
    handleValidation(req, res);
    try {
        const base64 = await qrcode.toDataURL(
            JSON.stringify({
                contractAddress: req.params.address,
                contract: 'WithdrawPoll',
                method: 'revokeVote',
            }),
        );
        res.send({ base64 });
    } catch (err) {
        logger.error(err);
        return res.status(500).end();
    }
};

/**
 * Revoke a vote for a withdrawal
 * @route DELETE /withdrawals/:address/vote/
 */
export const deleteWithdrawalVote = async (req: Request, res: Response) => {
    handleValidation(req, res);
    try {
        const tx = await withdrawPollContract(req.params.address)
            .methods.revokeVote(req.body.voter, parseInt(req.body.nonce, 10), req.body.sig)
            .send(options);
        res.send({ tx });
    } catch (err) {
        logger.error(err);
        return res.status(500).end();
    }
};
