import { WithdrawState } from '../models/Withdraw';
import { Request, Response } from 'express';
import '../config/passport';
import { assetPoolContract, ASSET_POOL, gasStation, parseResultLog, withdrawPollContract } from '../util/network';
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
        res.status(500).json(errors.array()).end();
    }

    try {
        const withdrawal = withdrawPollContract(req.params.address);
        const beneficiary = await withdrawal.beneficiary();
        const amount = (await withdrawal.amount()).toNumber();
        const approvalState = await withdrawal.getCurrentApprovalState();
        const startTime = (await withdrawal.startTime()).toNumber();
        const endTime = (await withdrawal.endTime()).toNumber();
        const yesCounter = (await withdrawal.yesCounter()).toNumber();
        const noCounter = (await withdrawal.noCounter()).toNumber();
        const totalVoted = (await withdrawal.totalVoted()).toNumber();

        res.send({
            startTime: {
                raw: startTime,
                formatted: new Date(startTime * 1000),
            },
            endTime: {
                raw: endTime,
                formatted: new Date(endTime * 1000),
            },
            address: withdrawal.address,
            beneficiary,
            amount,
            approvalState,
            yesCounter,
            noCounter,
            totalVoted,
        });
    } catch (err) {
        logger.error(err.toString());
        res.status(500).json({ msg: err.toString() });
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
        const instance = assetPoolContract(req.header('AssetPool'));
        const withdrawPolls = (
            await instance.getPastEvents('WithdrawPollCreated', {
                filter: { member: req.body.member },
                fromBlock: 0,
                toBlock: 'latest',
            })
        ).map((event: any) => {
            return event.returnValues.poll;
        });

        res.send({ withdrawPolls });
    } catch (err) {
        logger.error(err.toString());
        res.status(500).json({ msg: err.toString() });
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
        let tx = await gasStation.call(req.body.call, req.header('AssetPool'), req.body.nonce, req.body.sig);
        tx = await tx.wait();

        const events = await parseResultLog(ASSET_POOL.abi, tx.logs);
        const event = events.filter((e: { name: string }) => e.name === 'WithdrawPollCreated')[0];
        const pollAddress = event.args.poll;

        res.redirect('/v1/withdrawals/' + pollAddress);
    } catch (err) {
        logger.error(err.toString());
        res.status(500).json({ msg: err.toString() });
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
export const getWithdrawalWithdraw = async (req: Request, res: Response) => {
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
        logger.error(err.toString());
        res.status(500).json({ msg: err.toString() });
    }
};

/**
 * @swagger
 * /withdrawals/:address/withdraw:
 *   post:
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
 *         description: OK
 */
export const postWithdrawalWithdraw = async (req: Request, res: Response) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json(errors.array()).end();
    }

    try {
        let tx = await gasStation.call(req.body.call, req.params.address, req.body.nonce, req.body.sig);
        tx = await tx.wait();

        res.redirect(`withdrawals/${req.params.address}`);
    } catch (err) {
        logger.error(err.toString());
        res.status(500).json({ msg: err.toString() });
    }
};
