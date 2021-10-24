import MailService from '../../services/MailService';
import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../../models/Error';
import AccountService from '../../services/AccountService';

export const postAuthenticationToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { account, error } = await AccountService.getByEmail(req.body.email);

        if (error) {
            throw new Error(error);
        } else {
            const { error } = await MailService.sendLoginLinkEmail(account, req.body.password);

            if (error) {
                throw new Error(error);
            } else {
                return res.json({ message: `E-mail sent to ${account.email}` });
            }
        }
    } catch (error) {
        return next(new HttpError(500, error.toString(), error));
    }
};

/**
 * @swagger
 * /authentication_token:
 *   post:
 *     tags:
 *       - Authentication
 *     description: Returns a one-time login link for the wallet. Valid for 10 minutes.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: email
 *         in: body
 *         required: true
 *         type: string
 *     responses:
 *       '200':
 *         description: OK
 *         content: application/json 
 *         schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   description: One-time login link for wallet.
 *       '401':
 *         $ref: '#/components/responses/401'
 *       '403':
 *         description: Forbidden. Password reset token is invalid or has expired.
 *       '404':
 *         description: Not Found. Account does not exist.
 *       '500':
 *         $ref: '#/components/responses/500'
 *       '502':
 *         $ref: '#/components/responses/502'
 */
