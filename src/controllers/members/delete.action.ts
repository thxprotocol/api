import { NextFunction, Request, Response } from 'express';
import { assetPoolContract } from '../../util/network';
import { HttpError } from '../../models/Error';

/**
 * @swagger
 * /members:
 *   delete:
 *     tags:
 *       - Members
 *     description: Remove a member from the asset pool
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
export const deleteMember = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const instance = assetPoolContract(req.header('AssetPool'));

        await instance.removeMember(req.params.address);

        res.end();
    } catch (err) {
        next(new HttpError(502, 'Asset Pool removeMember failed.', err));
    }
};
