import { NextFunction, Request, Response } from 'express';
import { HttpError } from '../../models/Error';
import qrcode from 'qrcode';

/**
 * @swagger
 * /withdrawals/:address/withdraw:
 *   get:
 *     tags:
 *       - Withdrawals
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
 *       '200':
 *         description: OK
 *         schema:
 *            type: object
 *            properties:
 *               base64:
 *                  type: string
 *                  description: Base64 string representing function call*
 *       '400':
 *          description: Bad Request. Indicates incorrect body parameters.
 *       '401':
 *          description: Unauthorized. Authenticate your request please.
 *       '403':
 *          description: Forbidden. Your account does not have access to this pool.
 *       '500':
 *          description: Internal Server Error.
 *       '502':
 *          description: Bad Gateway. Received an invalid response from the network or database.
 */
export const getWithdrawalWithdraw = async (req: Request, res: Response, next: NextFunction) => {
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
        next(new HttpError(500, 'QR code encoding failed.', err));
    }
};
