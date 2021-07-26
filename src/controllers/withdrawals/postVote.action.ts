import qrcode from 'qrcode';
import { HttpError } from '@/models/Error';
import { NextFunction, Request, Response } from 'express';

/**
 * @swagger
 * /withdrawals/:id/vote:
 *   post:
 *     tags:
 *       - Withdrawals
 *     description: Provides a QR image that can be used to vote.
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
 *       - name: agree
 *         in: body
 *         required: true
 *         type: boolean
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
 */
export const postVote = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const base64 = await qrcode.toDataURL(
            JSON.stringify({
                assetPoolAddress: req.header('AssetPool'),
                method: 'vote',
                params: {
                    id: req.params.id,
                    agree: req.body.agree,
                },
            }),
        );
        res.json({ base64 });
    } catch (err) {
        next(new HttpError(500, 'Could not encode the QR image properly.', err));
    }
};
