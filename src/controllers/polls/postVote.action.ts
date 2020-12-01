import { gasStation } from '../../util/network';
import { HttpError } from '../../models/Error';
import { NextFunction, Request, Response } from 'express';
import { VERSION } from '../../util/secrets';

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
