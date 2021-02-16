import { admin, assetPoolFactory, provider, solutionContract, updateToBypassPolls } from '../../util/network';
import { events } from '../../util/events';
import { AssetPool } from '../../models/AssetPool';
import { Response, NextFunction } from 'express';
import { HttpError, HttpRequest } from '../../models/Error';
import MongoAdapter from '../../oidc/adapter';

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
export const postAssetPool = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        const code = await provider.getCode(req.body.token);

        if (code === '0x') {
            return next(new HttpError(404, `No data found at ERC20 address ${req.body.token}`));
        }

        const audience = req.user.aud;
        const ev = await events(await assetPoolFactory.deployAssetPool());
        const event = ev.find((e: { event: string }) => e.event === 'AssetPoolDeployed');

        if (!event) {
            return next(new HttpError(502, 'Check API health status.'));
        }

        const solution = solutionContract(event.args.assetPool);

        await (await solution.initializeRoles(await admin.getAddress())).wait();
        await (await solution.initializeGasStation(await admin.getAddress())).wait();
        await (await solution.addToken(req.body.token)).wait();
        await (await solution.setSigning(true)).wait();

        await updateToBypassPolls(solution);

        try {
            await new AssetPool({
                address: solution.address,
                title: req.body.title,
                client: audience,
            }).save();

            try {
                const Client = new MongoAdapter('client');
                const payload = await Client.find(audience);

                if (payload.assetPools) {
                    payload.assetPools.push(solution.address);
                } else {
                    payload.assetPools = [solution.address];
                }

                await Client.coll().updateOne({ _id: audience }, { $set: { payload } }, { upsert: false });

                res.status(201).json({ address: solution.address });
            } catch (error) {
                next(new HttpError(502, 'Client account update failed.', error));
            }
        } catch (error) {
            next(new HttpError(502, 'Asset Pool database save failed.', error));
        }
    } catch (error) {
        next(new HttpError(502, 'Asset Pool network deploy failed.', error));
    }
};
