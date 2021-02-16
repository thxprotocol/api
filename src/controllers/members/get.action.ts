import { NextFunction, Response } from 'express';
import { provider, tokenContract } from '../../util/network';
import { HttpError, HttpRequest } from '../../models/Error';
import { parseLogs } from '../../util/events';
import IDefaultDiamondArtifact from '../../artifacts/contracts/contracts/IDefaultDiamond.sol/IDefaultDiamond.json';

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
export const getMember = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        let address = req.params.address;
        const isMember = await req.solution.isMember(address);

        if (!isMember) {
            const filter = req.solution.filters.MemberAddressChanged(null, req.params.address, null);
            const logs = await provider.getLogs(filter);
            const events = await parseLogs(IDefaultDiamondArtifact.abi, logs);

            if (!events.length) {
                return next(new HttpError(404, 'Address is not a member.'));
            }

            address = events[events.length - 1].args.newAddress;
        }

        const tokenAddress = await req.solution.getToken();
        const tokenInstance = tokenContract(tokenAddress);
        const balance = await tokenInstance.balanceOf(req.params.address);

        res.json({
            address,
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
