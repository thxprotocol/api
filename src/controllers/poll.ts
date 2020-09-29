import { Request, Response } from 'express';
import '../config/passport';
import { options, basePollContract } from '../util/network';
import logger from '../util/logger';
import { handleValidation } from '../util/validation';
const qrcode = require('qrcode');

/**
 * Cast a vote for a poll
 * @route GET /polls/:address/vote/:agree
 */
export const getVote = async (req: Request, res: Response) => {
    handleValidation(req, res);
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
 * Get a poll
 * @route GET /polls/:address
 */
export const getPoll = async (req: Request, res: Response) => {
    handleValidation(req, res);

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
 * Cast a vote for a poll
 * @route POST /polls/:address/vote
 */
export const postVote = async (req: Request, res: Response) => {
    handleValidation(req, res);
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
 * Cast a vote for a poll
 * @route GET /polls/:address/revoke_vote
 */
export const getRevokeVote = async (req: Request, res: Response) => {
    handleValidation(req, res);
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
 * Revoke a vote for a poll
 * @route DELETE /polls/:address/vote
 */
export const deleteVote = async (req: Request, res: Response) => {
    handleValidation(req, res);
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
