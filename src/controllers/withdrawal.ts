import { WithdrawState } from '../models/Withdraw';
import { Request, Response } from 'express';
import '../config/passport';
import { assetPoolContract, options, withdrawPollContract } from '../util/network';
import logger from '../util/logger';
import { validationResult } from 'express-validator';

const qrcode = require('qrcode');

/**
 * @swagger
 * /withdrawals/:address:
 *   get:
 *     tags:
 *       - withdrawals
 *     description: Get information about a withdrawal
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: AssetPool
 *         in: header
 *         required: true
 *         type: string
 *       - name: address
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         startTime: DateTime of the start of the poll
 *         endTime: DateTime of the start of the poll
 *         withdrawal: Address of the withdraw poll
 *         beneficiary: Beneficiary of the withdraw poll
 *         amount: Rewarded amount for the beneficiary
 *         state: WithdrawState [Pending, Approved, Rejected, Withdrawn]
 *         yesCounter: Amount of yes votes
 *         noCounter: Amount of no votes
 *         totalVotes: Total amount of votes
 *         finalized: Is the poll finalized or not
 */
export const getWithdrawal = async (req: Request, res: Response) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(500).json(errors.array()).end();
    }

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
        return res.status(500).end();
    }
};

/**
 * @swagger
 * /withdrawals:
 *   get:
 *     tags:
 *       - withdrawals
 *     description: Get a list of withdrawals for the asset pool.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: AssetPool
 *         in: header
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         withdrawPolls: ...
 */
export const getWithdrawals = async (req: Request, res: Response) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(500).json(errors.array()).end();
    }

    try {
        const assetPool = assetPoolContract(req.header('AssetPool'));
        const withdrawPolls = (
            await assetPool.getPastEvents('WithdrawPollCreated', {
                filter: { member: req.body.member },
                fromBlock: 0,
                toBlock: 'latest',
            })
        ).map((event) => {
            return event.returnValues.poll;
        });

        res.send({ withdrawPolls });
    } catch (err) {
        logger.error(err);
        res.status(500).end();
    }
};

/**
 * @swagger
 * /withdrawals:
 *   post:
 *     tags:
 *       - withdrawals
 *     description: Propose a withdrawal in the asset pool.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: AssetPool
 *         in: header
 *         required: true
 *         type: string
 *       - name: amount
 *         in: body
 *         required: true
 *         type: integer
 *       - name: beneficiary
 *         in: body
 *         required: true
 *         type: string
 *     responses:
 *       304: /withdrawals/:address
 *       200:
 *         data: ...
 */
export const postWithdrawal = async (req: Request, res: Response) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(500).json(errors.array()).end();
    }

    try {
        const tx = await assetPoolContract(req.header('AssetPool'))
            .methods.proposeWithdraw(req.body.amount.toString(), req.body.beneficiary)
            .send(options);
        const pollAddress = tx.events.WithdrawPollCreated.returnValues.poll;

        res.redirect('/v1/withdrawals/' + pollAddress);
    } catch (err) {
        logger.error(err);
        res.status(500).end();
    }
};

/**
 * @swagger
 * /withdrawals/:address/withdraw:
 *   get:
 *     tags:
 *       - withdrawals
 *     description: Create a quick response image for withdrawing the reward.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: AssetPool
 *         in: header
 *         required: true
 *         type: string
 *       - name: address
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         base64: data:image/jpeg;base64,...
 */
export const getWithdraw = async (req: Request, res: Response) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(500).json(errors.array()).end();
    }

    try {
        const base64 = await qrcode.toDataURL(
            JSON.stringify({
                contractAddress: req.params.address,
                contract: 'WithdrawPoll',
                method: 'withdraw',
            }),
        );
        res.send({ base64 });
    } catch (err) {
        logger.error(err);
        return res.status(500).end();
    }
};
