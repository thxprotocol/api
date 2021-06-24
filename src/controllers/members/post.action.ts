import { NextFunction, Response } from 'express';
import { HttpRequest, HttpError } from '../../models/Error';
import { VERSION } from '../../util/secrets';
import { Account } from '../../models/Account';
import { callFunction, sendTransaction, SolutionArtifact } from '../../util/network';
import { parseLogs, findEvent } from '../../util/events';

export async function updateMemberProfile(address: string, poolAddress: string) {
    try {
        const account = await Account.findOne({ address: address });

        if (!account) {
            return;
        }
        if (!account.memberships) {
            account.memberships = [];
        }
        if (account.memberships.indexOf(poolAddress) > -1) {
            return;
        }

        account.memberships.push(poolAddress);

        return account.save();
    } catch (e) {
        console.log(e);
    }
}

/**
 * @swagger
 * /members:
 *   post:
 *     tags:
 *       - Members
 *     description: Adds a membership to the asset pool and updates the account with the address.
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
 *          description: Redirect. GET /members/:address.
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
export const postMember = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        const result = await callFunction(req.solution.methods.isMember(req.body.address), req.assetPool.network);

        if (result) {
            await updateMemberProfile(req.body.address, req.solution.options.address);
            return next(new HttpError(400, 'Address is member already.'));
        }

        try {
            const tx = await sendTransaction(
                req.solution.options.address,
                req.solution.methods.addMember(req.body.address),
                req.assetPool.network,
            );

            try {
                const events = parseLogs(SolutionArtifact.abi, tx.logs);
                const event = findEvent('RoleGranted', events);
                const address = event.args.account;

                await updateMemberProfile(req.body.address, req.solution.options.address);

                res.redirect(`/${VERSION}/members/${address}`);
            } catch (err) {
                return next(new HttpError(500, 'Parse logs failed.', err));
            }
        } catch (err) {
            return next(new HttpError(502, 'Asset Pool addMember failed.', err));
        }
    } catch (err) {
        return next(new HttpError(502, 'Asset Pool isMember failed.', err));
    }
};
