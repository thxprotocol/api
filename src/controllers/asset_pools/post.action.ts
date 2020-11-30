import { admin, assetPoolFactory } from '../../util/network';
import { AssetPool, AssetPoolDocument } from '../../models/AssetPool';
import { Account, AccountDocument } from '../../models/Account';
import { Request, Response, NextFunction } from 'express';
import { assetPoolContract, tokenContract } from '../../util/network';
import { GAS_STATION_ADDRESS, VERSION } from '../../util/secrets';
import { HttpError } from '../../models/Error';

/**
 * @swagger
 * /asset_pools:
 *   post:
 *     tags:
 *       - Asset Pools
 *     description: Create a new asset pool, deploy it on the network and retrieve the address.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: title
 *         in: body
 *         required: true
 *         type: string
 *       - name: token
 *         description: Address of the ERC20 token used for this pool.
 *         in: body
 *         required: true
 *         type: string
 *     responses:
 *       '200':
 *         description: OK.
 *         schema:
 *             type: object
 *             properties:
 *                address:
 *                   type: string
 *                   description: Address of the new asset pool.
 *       '400':
 *         description: Bad Request. Could indicate incorrect rewardPollDuration or proposeWithdrawPollDuration values.
 *       '401':
 *         description: Unauthorized. Authenticate your request please.
 *       '500':
 *         description: Internal Server Error.
 *       '502':
 *         description: Bad Gateway. Received an invalid response from the network or database.
 */
export const postAssetPool = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const assetPool = await assetPoolFactory.deploy(admin.address, GAS_STATION_ADDRESS, req.body.token);

        try {
            await new AssetPool({
                address: assetPool.address,
                title: req.body.title,
                uid: req.session.passport.user,
            }).save();

            try {
                const account: AccountDocument = await Account.findById((req.user as AccountDocument).id);

                if (!account.profile.assetPools.includes(assetPool.address)) {
                    account.profile.assetPools.push(assetPool.address);
                    await account.save();
                }

                res.status(201).json({ address: assetPool.address });
            } catch (error) {
                next(new HttpError(502, 'Account account update failed.', error));
            }
        } catch (error) {
            next(new HttpError(502, 'Asset Pool database save failed.', error));
        }
    } catch (error) {
        next(new HttpError(502, 'Asset Pool network deploy failed.', error));
    }
};
