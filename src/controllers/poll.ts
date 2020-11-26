import qrcode from 'qrcode';
import logger from '../util/logger';
import { basePollContract, gasStation } from '../util/network';
import { validationResult } from 'express-validator';
import { HttpError } from '../models/Error';
import { NextFunction, Request, Response } from 'express';
import { VERSION } from '../util/secrets';

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
 *       '200':
 *         description: OK
 *         schema:
 *            type: object
 *            properties:
 *               base64:
 *                  type: string
 *                  description: Base64 string representing function call
 *       '400':
 *         description: Bad Request. Indicates incorrect body parameters.
 *       '401':
 *         description: Unauthorized. Authenticate your request please.
 *       '403':
 *         description: Forbidden. Your account does not have access to this pool.
 *       '500':
 *         description: Internal Server Error.
 *       '502':
 *         description: Bad Gateway. Received an invalid response from the network or database.
 */
export const getVote = async (req: Request, res: Response, next: NextFunction) => {
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
        next(new HttpError(500, 'QR data encoding failed.', err));
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
 *       '200':
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
 *       '400':
 *         description: Bad Request. Indicates incorrect path parameters.
 *       '401':
 *         description: Unauthorized. Authenticate your request please.
 *       '403':
 *         description: Forbidden. Your account does not have access to this pool.
 *       '500':
 *         description: Internal Server Error.
 *       '502':
 *         description: Bad Gateway. Received an invalid response from the network or database.
 *
 */
export const getPoll = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const poll = basePollContract(req.params.address);
        const startTime = await poll.startTime();
        const endTime = await poll.endTime();

        res.json({
            startTime: {
                raw: startTime,
                formatted: new Date(startTime * 1000),
            },
            endTime: {
                raw: endTime,
                formatted: new Date(endTime * 1000),
            },
            yesCounter: (await poll.yesCounter()).toNumber(),
            noCounter: (await poll.noCounter()).toNumber(),
            totalVoted: (await poll.totalVoted()).toNumber(),
        });
    } catch (err) {
        next(new HttpError(502, 'Base Poll get contract data failed.', err));
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
export const postVote = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tx = await gasStation.call(req.body.call, req.params.address, req.body.nonce, req.body.sig);

        await tx.wait();

        res.redirect(`/${VERSION}/polls/${req.params.address}`);
    } catch (err) {
        next(new HttpError(502, 'Gas Station call failed.', err));
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
 *       '200':
 *         description: OK
 *         schema:
 *            type: object
 *            properties:
 *               base64:
 *                  type: string
 *                  description: Base64 string representing function call
 *       '400':
 *         description: Bad Request. Indicates incorrect body parameters.
 *       '401':
 *         description: Unauthorized. Authenticate your request please.
 *       '403':
 *         description: Forbidden. Your account does not have access to this pool.
 *       '500':
 *         description: Internal Server Error.
 *       '502':
 *         description: Bad Gateway. Received an invalid response from the network or database.
 */
export const getRevokeVote = async (req: Request, res: Response, next: NextFunction) => {
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
        next(new HttpError(500, 'QR data encoding failed.', err));
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
 *       '200':
 *         description: OK
 *       '302':
 *          description: Redirect to `GET /polls/:address`
 *          headers:
 *             Location:
 *                type: string
 *       '400':
 *         description: Bad Request. Indicates incorrect body parameters.
 *       '401':
 *         description: Unauthorized. Authenticate your request please.
 *       '403':
 *         description: Forbidden. Your account does not have access to this pool.
 *       '500':
 *         description: Internal Server Error.
 *       '502':
 *         description: Bad Gateway. Received an invalid response from the network or database.
 *
 */
export const deleteVote = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const instance = basePollContract(req.params.address);

        await instance.revokeVote(req.body.voter, parseInt(req.body.nonce, 10), req.body.sig);

        res.redirect(`/${VERSION}/polls/${req.params.address}`);
    } catch (err) {
        next(new HttpError(502, 'Base Poll revokeVote failed.', err));
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
 *       '200':
 *         description: OK
 *       '302':
 *          description: Redirect to `GET /polls/:address`
 *          headers:
 *             Location:
 *                type: string
 *       '400':
 *         description: Bad Request. Indicates incorrect body parameters.
 *       '401':
 *         description: Unauthorized. Authenticate your request please.
 *       '403':
 *         description: Forbidden. Your account does not have access to this pool.
 *       '500':
 *         description: Internal Server Error.
 *       '502':
 *         description: Bad Gateway. Received an invalid response from the network or database.
 */
export const postPollFinalize = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tx = await gasStation.call(req.body.call, req.params.address, req.body.nonce, req.body.sig);
        await tx.wait();

        res.redirect(`/${VERSION}/polls/${req.params.address}`);
    } catch (err) {
        next(new HttpError(502, 'Gas Station call failed.', err));
    }
};
