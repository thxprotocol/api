import {
    admin,
    assetPoolFactory,
    provider,
    logTransaction,
    solutionContract,
    unlimitedSupplyERC20Factory,
    limitedSupplyERC20Factory,
} from '../../util/network';
import { AssetPool } from '../../models/AssetPool';
import { Response, NextFunction } from 'express';
import { HttpError, HttpRequest } from '../../models/Error';
import MongoAdapter from '../../oidc/adapter';
import { Error } from 'mongoose';
import { indexer } from '../../util/indexer';

async function getTokenAddress(token: any, poolAddress: string) {
    if (token.address) {
        const code = await provider.getCode(token.address);

        if (code === '0x') {
            return new Error(`No data found at ERC20 address ${token.address}`);
        }

        return token.address;
    } else if (token.name && token.symbol && token.totalSupply) {
        const tokenInstance = await limitedSupplyERC20Factory.deploy(
            token.name,
            token.symbol,
            poolAddress,
            token.totalSupply,
        );

        return tokenInstance.address;
    } else if (token.name && token.symbol && poolAddress) {
        const tokenInstance = await unlimitedSupplyERC20Factory.deploy(token.name, token.symbol, poolAddress);

        return tokenInstance.address;
    }
}

/**
 * @swagger
 * /asset_pools:
 *   post:
 *     tags:
 *       - Asset Pools
 *     description: Deploys a new asset pool with an ERC20 token configured for it.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: title
 *         in: body
 *         required: true
 *         type: string
 *       - name: token
 *         description: Contract address of the ERC20 configured for this pool.
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
        const token = req.body.token;
        const audience = req.user.aud;
        const tx = await (await assetPoolFactory.deployAssetPool()).wait();
        const event = tx.events.find((e: { event: string }) => e.event === 'AssetPoolDeployed');

        logTransaction(tx);

        if (!event) {
            return next(new HttpError(502, 'Check API health status.'));
        }

        const solution = solutionContract(event.args.assetPool);

        await solution.initializeRoles(await admin.getAddress());
        await solution.initializeGasStation(await admin.getAddress());
        await solution.setSigning(true);

        try {
            await new AssetPool({
                address: solution.address,
                title: req.body.title,
                client: audience,
                blockNumber: event.blockNumber,
                transactionHash: event.transactionHash,
                bypassPolls: false,
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

                try {
                    const tokenAddress = getTokenAddress(token, solution.address);

                    await solution.addToken(tokenAddress);
                } catch (e) {
                    return next(new HttpError(502, 'Asset Pool addToken() failed.'));
                }

                indexer.add(solution.address);

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
