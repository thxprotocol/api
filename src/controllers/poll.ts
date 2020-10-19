import { Request, Response } from 'express';
import '../config/passport';
import { options, basePollContract } from '../util/network';
import logger from '../util/logger';
import { validationResult } from 'express-validator';
const qrcode = require('qrcode');

/**
 * @swagger
 * /polls/:address/vote/:agree:
 *   get:
 *     tags:
 *       - polls
 *     description: Get a quick response image to vote.
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
 *       - name: agree
 *         description: Provide 0 to disagree and 1 to agree
 *         in: path
 *         required: true
 *         type: int
 *     responses:
 *       200:
 *         base64: ...
 */
export const getVote = async (req: Request, res: Response) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(500).send(errors.array()).end();
    }

    try {
        const base64 = await qrcode.toDataURL(
            JSON.stringify({
                contractAddress: req.params.address,
                contract: 'BasePoll',
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
 * @swagger
 * /polls/:address/:
 *   get:
 *     tags:
 *       - polls
 *     description: Get general information about a poll.
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
 *         data: ...
 */
export const getPoll = async (req: Request, res: Response) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(500).send(errors.array()).end();
    }

    try {
        const poll = basePollContract(req.params.address);
        const startTime = await poll.methods.startTime().call(options);
        const endTime = await poll.methods.endTime().call(options);
        const yesCounter = await poll.methods.yesCounter().call(options);
        const noCounter = await poll.methods.noCounter().call(options);
        const totalVoted = await poll.methods.totalVoted().call(options);
        const finalized = await poll.methods.finalized().call(options);

        res.send({
            startTime: new Date(startTime * 1000),
            endTime: new Date(endTime * 1000),
            withdrawal: poll.options.address,
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
 * @swagger
 * /polls/:address/vote:
 *   post:
 *     tags:
 *       - polls
 *     description: Get a quick response image to vote.
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
 *       - name: voter
 *         in: body
 *         required: true
 *         type: string
 *       - name: agree
 *         description: Provide 0 to disagree and 1 to agree
 *         in: body
 *         required: true
 *         type: int
 *       - name: nonce
 *         in: body
 *         required: true
 *         type: int
 *       - name: sig
 *         in: body
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         base64: ...
 */
export const postVote = async (req: Request, res: Response) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(500).send(errors.array()).end();
    }

    try {
        const tx = await basePollContract(req.params.address)
            .methods.vote(req.body.voter, JSON.parse(req.body.agree), parseInt(req.body.nonce, 10), req.body.sig)
            .send(options);
        res.send({ tx });
    } catch (err) {
        logger.error(err);
        return res.status(500).end();
    }
};

/**
 * @swagger
 * /polls/:address/revoke_vote:
 *   get:
 *     tags:
 *       - polls
 *     description: Cast a vote for a poll
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
 *         base64: ...
 */
export const getRevokeVote = async (req: Request, res: Response) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(500).send(errors.array()).end();
    }

    try {
        const base64 = await qrcode.toDataURL(
            JSON.stringify({
                contractAddress: req.params.address,
                contract: 'BasePoll',
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
 * @swagger
 * /polls/:address/vote:
 *   delete:
 *     tags:
 *       - polls
 *     description: Cast a vote for a poll
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
 *       - name: voter
 *         in: body
 *         required: true
 *         type: string
 *       - name: nonce
 *         in: body
 *         required: true
 *         type: int
 *       - name: sig
 *         in: body
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *          description: An asset pool object exposing the configuration and balance.
 *          schema:
 *              type: object
 *              properties:
 *                  base64:
 *                      type: string
 *                      description: Set as src for <img> and scan with wallet.
 */
export const deleteVote = async (req: Request, res: Response) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(500).send(errors.array()).end();
    }

    try {
        const tx = await basePollContract(req.params.address)
            .methods.revokeVote(req.body.voter, parseInt(req.body.nonce, 10), req.body.sig)
            .send(options);
        res.send({ tx });
    } catch (err) {
        logger.error(err);
        return res.status(500).end();
    }
};
