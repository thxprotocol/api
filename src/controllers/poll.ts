import { Request, Response } from 'express';
import '../config/passport';
import { options, basePollContract, assetPoolContract, web3, gasStation } from '../util/network';
import logger from '../util/logger';
import { validationResult } from 'express-validator';
const qrcode = require('qrcode');

/**
 * @swagger
 * /polls/:address/vote/:agree:
 *   get:
 *     tags:
 *       - Polls
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
 *         type: integer
 *     responses:
 *       200:
 *         base64: data:image/png;base64,...
 */
export const getVote = async (req: Request, res: Response) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json(errors.array()).end();
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
        res.json({ base64 });
    } catch (err) {
        logger.error(err.toString());
        res.status(500).json({ error: err.toString() });
    }
};

/**
 * @swagger
 * /polls/:address/:
 *   get:
 *     tags:
 *       - Polls
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
 *       404:
 *         description: Poll is nto found
 *       200:
 *         description: OK
 *         schema:
 *            type: object
 *            properties:
 *               startTime:
 *                  type: object
 *                  properties:
 *                      raw:
 *                          type: number
 *                          description: Unix timestamp for start of the poll
 *                      formatted:
 *                          type: string
 *                          description: Date string of start of the poll
 *               endTime:
 *                  type: object
 *                  properties:
 *                      raw:
 *                          type: number
 *                          description: Unix timestamp for start of the poll
 *                      formatted:
 *                          type: string
 *                          description: Date string of start of the poll
 *               yesCounter:
 *                  type: number
 *                  description: Amount of yes votes on the poll
 *               noCounter:
 *                  type: number
 *                  description: Amount of no votes on the poll
 *               totalVoted:
 *                  type: number
 *                  description: Total amount of votes on the poll
 *               finalized:
 *                  type: boolean
 *                  description: Poll is finalized or not
 *
 */
export const getPoll = async (req: Request, res: Response) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json(errors.array()).end();
    }

    try {
        const poll = basePollContract(req.params.address);
        const startTime = await poll.methods.startTime().call(options);
        const endTime = await poll.methods.endTime().call(options);

        res.json({
            startTime: {
                raw: startTime,
                formatted: new Date(startTime * 1000),
            },
            endTime: {
                raw: endTime,
                formatted: new Date(endTime * 1000),
            },
            yesCounter: await poll.methods.yesCounter().call(options),
            noCounter: await poll.methods.noCounter().call(options),
            totalVoted: await poll.methods.totalVoted().call(options),
        });
    } catch (err) {
        logger.error(err.toString());
        res.status(404).json({ error: err.toString() });
    }
};

/**
 * @swagger
 * /polls/:address/vote:
 *   post:
 *     tags:
 *       - Polls
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
 *         in: body
 *         required: true
 *         type: boolean
 *       - name: nonce
 *         in: body
 *         required: true
 *         type: integer
 *       - name: sig
 *         in: body
 *         required: true
 *         type: string
 *     responses:
 *       302:
 *          headers:
 *              Location:
 *                  type: string
 *                  description: Redirect route to /polls/:address
 */
export const postVote = async (req: Request, res: Response) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json(errors.array()).end();
    }

    try {
        await gasStation.methods.call(req.body.call, req.params.address, req.body.nonce, req.body.sig).send(options);

        res.redirect(`polls/${req.params.address}`);
    } catch (err) {
        logger.error(err.toString());
        res.status(500).json({ error: err.toString() });
    }
};

/**
 * @swagger
 * /polls/:address/revoke_vote:
 *   get:
 *     tags:
 *       - Polls
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
 *         base64: data:image/png;base64,...
 */
export const getRevokeVote = async (req: Request, res: Response) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(500).json(errors.array()).end();
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
 *       - Polls
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
 *         type: integer
 *       - name: sig
 *         in: body
 *         required: true
 *         type: string
 *     responses:
 *       302:
 *          headers:
 *              Location:
 *                  type: string
 *                  description: Redirect route to /polls/:address
 *
 */
export const deleteVote = async (req: Request, res: Response) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(500).json(errors.array()).end();
    }

    try {
        await basePollContract(req.params.address)
            .methods.revokeVote(req.body.voter, parseInt(req.body.nonce, 10), req.body.sig)
            .send(options);

        res.redirect('polls/' + req.params.address);
    } catch (err) {
        logger.error(err);
        return res.status(500).end();
    }
};

/**
 * @swagger
 * /polls/:address/finalize:
 *   post:
 *     tags:
 *       - Rewards
 *     description: Finalize the reward and update struct
 *     produces:
 *       - application/json
 *     responses:
 *       302:
 *          headers:
 *              Location:
 *                  type: string
 *                  description: Redirect route to /polls/:address
 */
export const postPollFinalize = async (req: Request, res: Response) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json(errors.array()).end();
    }

    try {
        await gasStation.methods.call(req.body.call, req.params.address, req.body.nonce, req.body.sig).send(options);

        res.redirect('polls/' + req.params.address);
    } catch (err) {
        logger.error(err.toString());
        res.status(500).json({ msg: err.toString() });
    }
};
