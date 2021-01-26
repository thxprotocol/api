import { HttpError, HttpRequest } from '../../models/Error';
import { NextFunction, Response } from 'express';

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
 *       - name: id
 *         in: path
 *         required: true
 *         type: number
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
export const getPoll = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        res.json({
            startTime: (await req.solution.getStartTime(req.params.id)).toNumber(),
            endTime: (await req.solution.getEndTime(req.params.id)).toNumber(),
            yesCounter: (await req.solution.getYesCounter(req.params.id)).toNumber(),
            noCounter: (await req.solution.getNoCounter(req.params.id)).toNumber(),
            totalVoted: (await req.solution.getTotalVoted(req.params.id)).toNumber(),
        });
    } catch (err) {
        next(new HttpError(502, 'Base Poll get contract data failed.', err));
    }
};
