import qrcode from 'qrcode';
import { HttpError } from '../../models/Error';
import { NextFunction, Request, Response } from 'express';
import WithdrawalService from '../../services/WithdrawalService';

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
 *         content: application/json
 *         schema:
 *               type: object
 *               properties:
 *                 base64:
 *                   type: string
 *                   description: Base64 string representing function call
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
export const postVote = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { withdrawal } = await WithdrawalService.getById(req.params.id);
        const base64 = await qrcode.toDataURL(
            JSON.stringify({
                assetPoolAddress: req.header('AssetPool'),
                method: 'vote',
                params: {
                    id: withdrawal.withdrawalId,
                    agree: req.body.agree,
                },
            }),
        );
        res.json({ base64 });
    } catch (err) {
        next(new HttpError(500, 'Could not encode the QR image properly.', err));
    }
};
