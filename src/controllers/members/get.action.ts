import { NextFunction, Request, Response } from 'express';
import { ISolutionRequest, solutionContract, tokenContract } from '../../util/network';
import { HttpError } from '../../models/Error';

/**
 * @swagger
 * /members/:address:
 *   get:
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
 *       200:
 *         description: OK
 *         schema:
 *            type: object
 *            properties:
 *               token:
 *                  type: object
 *                  properties:
 *                     name:
 *                        type: string
 *                        description: The name of the token configured for this asset pool
 *                     symbol:
 *                        type: string
 *                        description: The symbol of the token configured for this asset pool
 *                     balance:
 *                        type: number
 *                        description: The token balance of the asset pool for this token
 *               isMember:
 *                  type: boolean
 *                  description: If this address is known as member of the asset pool
 *               isManager:
 *                  type: boolean
 *                  description: If this address is known as manager of the asset pool
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
export const getMember = async (req: ISolutionRequest, res: Response, next: NextFunction) => {
    try {
        const isMember = await req.solution.isMember(req.params.address);

        if (!isMember) {
            next(new HttpError(404, 'Address is not a member.'));
            return;
        }

        const tokenAddress = await req.solution.getToken();
        const tokenInstance = tokenContract(tokenAddress);
        const balance = await tokenInstance.balanceOf(req.params.address);

        res.json({
            isMember,
            isManager: await req.solution.isManager(req.params.address),
            token: {
                name: await tokenInstance.name(),
                symbol: await tokenInstance.symbol(),
                balance,
            },
        });
    } catch (err) {
        next(new HttpError(502, 'Asset Pool get member failed.', err));
    }
};
