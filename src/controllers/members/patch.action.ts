import { NextFunction, Response } from 'express';
import { HttpRequest, HttpError } from '../../models/Error';
import { VERSION } from '../../util/secrets';

/**
 * @swagger
 * /members/:address:
 *   patch:
 *     tags:
 *       - Members
 *     description: Get information about a member in the asset pool
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
 *         description: Bad Request. Indicates incorrect body parameters.
 *       '401':
 *         description: Unauthorized. Authenticate your request please.
 *       '403':
 *         description: Forbidden. Your account does not have access to this pool.
 *       '404':
 *         description: Not Found. Address is not a member.
 *       '500':
 *         description: Internal Server Error.
 *       '502':
 *         description: Bad Gateway. Received an invalid response from the network or database.
 */
export const patchMember = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        const isMember = await req.solution.isMember(req.params.address);

        if (!isMember) {
            next(new HttpError(404, 'Address is not a member.'));
            return;
        }

        await req.solution[req.body.isManager ? 'addManager' : 'removeManager'](req.params.address);

        res.redirect(`/${VERSION}/members/${req.params.address}`);
    } catch (err) {
        next(new HttpError(502, 'Asset Pool add/remove Manager failed.', err));
    }
};
