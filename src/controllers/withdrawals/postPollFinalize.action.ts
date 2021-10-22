import qrcode from 'qrcode';
import { HttpError, HttpRequest } from '../../models/Error';
import { NextFunction, Response } from 'express';
import { sendTransaction } from '../../util/network';

/**
 * @swagger
 * /withdrawals/:id/withdraw:
 *   post:
 *     tags:
 *       - Withdrawals
 *     description: If the poll for this withdrawal is approved the reward will be withdrawn.
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
 *         content:
 *           application/json:  
 *             schema:
 *               type: object
 *               optional: true
 *               properties:
 *                 base64:
 *                   type: string
 *                   description: Base64 string representing function call if governance is disabled.
 *       '400':
 *         $ref: '#/components/responses/400'
 *       '401':
 *         $ref: '#/components/responses/401'
 *       '403':
 *         description: Forbidden. Your account does not have access to this pool.
 *       '500':
 *         $ref: '#/components/responses/500'
 *       '502':
 *         $ref: '#/components/responses/502'
 */
export const postPollFinalize = async (req: HttpRequest, res: Response, next: NextFunction) => {
    switch (req.assetPool.bypassPolls) {
        // BypassPolls enabled
        case true:
            try {
                await sendTransaction(
                    req.solution.options.address,
                    req.solution.methods.withdrawPollFinalize(req.params.id),
                    req.assetPool.network,
                );

                return res.status(200).end();
            } catch (err) {
                next(new HttpError(500, 'Could not finalize the withdraw poll.', err));
            }
            break;
        // BypassPolls disabled
        case false:
            try {
                const base64 = await qrcode.toDataURL(
                    JSON.stringify({
                        assetPoolAddress: req.solution.options.address,
                        method: 'withdrawPollFinalize',
                        params: {
                            id: req.params.id,
                        },
                    }),
                );

                return res.json({ base64 });
            } catch (err) {
                next(new HttpError(500, 'Could not encode the QR image properly.', err));
            }
            break;
    }
};
