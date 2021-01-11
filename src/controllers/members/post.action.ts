import { NextFunction, Request, Response } from 'express';
import { solutionContract, ASSET_POOL, parseLogs } from '../../util/network';
import { HttpError } from '../../models/Error';
import { VERSION } from '../../util/secrets';

/**
 * @swagger
 * /members:
 *   post:
 *     tags:
 *       - Members
 *     description: Add a member to the asset pool
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: AssetPool
 *         in: header
 *         required: true
 *         type: string
 *       - name: address
 *         in: body
 *         required: true
 *         type: string
 *     responses:
 *       '200':
 *         description: OK
 *       '302':
 *          description: Redirect to `GET /members/:address`
 *          headers:
 *             Location:
 *                type: string
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
export const postMember = async (req: Request, res: Response, next: NextFunction) => {
    const instance = solutionContract(req.header('AssetPool'));

    try {
        const result = await instance.isMember(req.body.address);

        if (result) {
            next(new HttpError(400, 'Address is member already.'));
            return;
        }

        try {
            const tx = await (await instance.addMember(req.body.address)).wait();

            try {
                const events = await parseLogs(ASSET_POOL.abi, tx.logs);
                const event = events.filter((e: { name: string }) => e && e.name === 'RoleGranted')[0];
                const address = event.args.account;

                res.redirect(`/${VERSION}/members/${address}`);
            } catch (err) {
                next(new HttpError(500, 'Parse logs failed.', err));
                return;
            }
        } catch (err) {
            next(new HttpError(502, 'Asset Pool addMember failed.', err));
        }
    } catch (err) {
        next(new HttpError(502, 'Asset Pool isMember failed.', err));
    }
};
