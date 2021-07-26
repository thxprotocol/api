import { Request, Response, NextFunction } from 'express';
import { HttpError } from '@/models/Error';
import qrcode from 'qrcode';

/**
 * @swagger
 * /rewards/:id/claim:
 *   post:
 *     tags:
 *       - Rewards
 *     description: Create a quick response image to claim the reward.
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
export const postRewardClaim = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const base64 = await qrcode.toDataURL(
            JSON.stringify({
                poolAddress: req.header('AssetPool'),
                name: 'claimReward',
                args: [req.params.id],
            }),
        );
        res.json({ base64 });
    } catch (err) {
        next(new HttpError(502, 'QR encode failed.', err));
    }
};
