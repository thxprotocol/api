import { NextFunction, Response } from 'express';
import { Account } from '../../models/Account';
import { HttpError, HttpRequest } from '../../models/Error';

/**
 * @swagger
 * /members/:address:
 *   delete:
 *     tags:
 *       - Members
 *     description: Revokes a membership from the asset pool
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
 */
export const deleteMember = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        const isMember = await req.solution.methods.isMember(req.params.address).call();

        if (isMember) {
            await req.solution.methods.removeMember(req.params.address).send();
        }

        try {
            const account = await Account.findOne({ address: req.params.address });

            if (account && account.memberships) {
                const index = account.memberships.indexOf(req.solution.options.address);

                if (index > -1) {
                    account.memberships.splice(index, 1);

                    await account.save();
                }
            }

            res.status(204).end();
        } catch (err) {
            next(new HttpError(502, 'Account profile update failed.', err));
        }
    } catch (err) {
        next(new HttpError(502, 'Asset Pool removeMember failed.', err));
    }
};
