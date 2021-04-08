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
import { Error } from 'mongoose';
import { eventIndexer } from '../../util/indexer';
import { parseEther } from 'ethers/lib/utils';
import { POOL_REGISTRY_ADDRESS } from '../../util/secrets';
import { Account } from '../../models/Account';

async function getTokenAddress(token: any, poolAddress: string) {
    if (token.address) {
        const code = await provider.getCode(token.address);

        if (code === '0x') {
            return new Error(`No data found at ERC20 address ${token.address}`);
        }

        return token.address;
    } else if (token.name && token.symbol && Number(token.totalSupply) > 0) {
        const tokenInstance = await limitedSupplyERC20Factory.deploy(
            token.name,
            token.symbol,
            poolAddress,
            parseEther(token.totalSupply),
        );
        return tokenInstance.address;
    } else if (token.name && token.symbol && Number(token.totalSupply) === 0) {
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
 *       - name: aud
 *         in: body
 *         required: true
 *         type: string
 *       - name: network
 *         in: body
 *         required: true
 *         type: number
 *       - name: token
 *         in: body
 *         required: true
 *         type: object
 *         properties:
 *           address:
 *             type: string
 *             description: Required for using an existing ERC20 token contract.
 *           name:
 *             type: string
 *             description: Required for using a new ERC20 token contract with a limited or unlimited supply.
 *           symbol:
 *             type: string
 *             description: Required for using a new ERC20 token contract with a limited or unlimited supply.
 *           totalSupply:
 *             type: number
 *             description: Required for using a new ERC20 token contract with a limited supply.
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
        const sub = req.user.sub;
        const tx = await (await assetPoolFactory.deployAssetPool()).wait();
        const event = tx.events.find((e: { event: string }) => e.event === 'AssetPoolDeployed');

        logTransaction(tx);

        if (!event) {
            return next(
                new HttpError(
                    502,
                    'Could not find a confirmation event in factory transaction. Check API health status at /v1/health.',
                ),
            );
        }

        const solution = solutionContract(event.args.assetPool);

        await solution.setPoolRegistry(POOL_REGISTRY_ADDRESS);
        await solution.initializeRoles(await admin.getAddress());
        await solution.initializeGasStation(await admin.getAddress());
        await solution.setSigning(true);

        const assetPool = new AssetPool({
            address: solution.address,
            title: req.body.title,
            sub,
            aud: req.body.aud,
            blockNumber: event.blockNumber,
            transactionHash: event.transactionHash,
            bypassPolls: false,
            network: req.body.network,
        });

        try {
            const tokenAddress = await getTokenAddress(token, solution.address);

            await solution.addToken(tokenAddress);
        } catch (e) {
            return next(new HttpError(502, 'Could not add a token to the asset pool.'));
        }

        await assetPool.save();

        try {
            const account = await Account.findById(sub);

            if (account.memberships) {
                account.memberships.push(solution.address);
            } else {
                account.memberships = [solution.address];
            }

            await account.save();

            eventIndexer.addListener(solution.address);

            res.status(201).json({ address: solution.address });
        } catch (error) {
            return next(new HttpError(502, 'Could not store the asset pool and account data.', error));
        }
    } catch (error) {
        return next(new HttpError(502, 'Could not deploy the asset pool on the network.', error));
    }
};
