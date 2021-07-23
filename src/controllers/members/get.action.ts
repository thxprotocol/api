import { NextFunction, Response } from 'express';
import { callFunction, tokenContract } from '../../util/network';
import { HttpError, HttpRequest } from '../../models/Error';
import { formatEther } from 'ethers/lib/utils';

/**
 * @swagger
 * /members/:address:
 *   get:
 *     tags:
 *       - Members
 *     description: Provides information about a membership for the pool.
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
 *               address:
 *                  type: string
 *                  description: The most recent address known for this member
 *               isMember:
 *                  type: boolean
 *                  description: If this address is known as member of the asset pool
 *               isManager:
 *                  type: boolean
 *                  description: If this address is known as manager of the asset pool
 *               balance:
 *                  type: object
 *                  properties:
 *                     name:
 *                        type: string
 *                        description: The name of the token configured for this asset pool
 *                     symbol:
 *                        type: string
 *                        description: The symbol of the token configured for this asset pool
 *                     amount:
 *                        type: number
 *                        description: The token balance of the asset pool for this token
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
        const address = req.params.address;
        const isMember = await callFunction(req.solution.methods.isMember(address), req.assetPool.network);

        if (!isMember) {
            // const filter = req.solution.events.MemberAddressChanged(null, address, null);
            // const provider = getProvider(req.assetPool.network);
            // const logs = await provider.eth.getPastLogs(filter);
            // const events = parseLogs(SolutionArtifact.abi, logs);

            // if (!events.length) {
            return next(new HttpError(404, 'Address is not a member.'));
            // }

            // const newAddress = events[events.length - 1].returnValues.newAddress;

            // return res.redirect(`/${VERSION}/members/${newAddress}`);
        } else {
            const tokenAddress = await callFunction(req.solution.methods.getToken(), req.assetPool.network);
            const tokenInstance = tokenContract(req.assetPool.network, tokenAddress);
            const balance = await callFunction(tokenInstance.methods.balanceOf(address), req.assetPool.network);

            res.json({
                address,
                isMember,
                isManager: await callFunction(req.solution.methods.isManager(address), req.assetPool.network),
                token: {
                    name: await callFunction(tokenInstance.methods.name(), req.assetPool.network),
                    symbol: await callFunction(tokenInstance.methods.symbol(), req.assetPool.network),
                    balance: Number(formatEther(balance)),
                },
            });
        }
    } catch (err) {
        return next(new HttpError(502, 'Asset Pool get member failed.', err));
    }
};
//
