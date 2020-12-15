import qrcode from 'qrcode';
import { basePollContract } from '../../util/network';
import { HttpError } from '../../models/Error';
import { NextFunction, Request, Response } from 'express';

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
