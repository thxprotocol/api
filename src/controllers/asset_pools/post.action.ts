import { solutionContract, getAssetPoolFactory, getAdmin, NetworkProvider, sendTransaction } from '@/util/network';
import { AssetPool } from '@/models/AssetPool';
import { Response, NextFunction } from 'express';
import { HttpError, HttpRequest } from '@/models/Error';
import { eventIndexer } from '@/util/indexer';
import { POOL_REGISTRY_ADDRESS, TESTNET_POOL_REGISTRY_ADDRESS } from '@/util/secrets';
import { Account } from '@/models/Account';
import { findEvent, parseLogs } from '@/util/events';
import { getRegistrationAccessToken, getTokenAddress } from './utils';
import { Artifacts } from '@/util/artifacts';

export const postAssetPool = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        const token = req.body.token;
        const sub = req.user.sub;
        const adminAddress = getAdmin(req.body.network).address;
        const assetPoolFactory = getAssetPoolFactory(req.body.network);
        const tx = await sendTransaction(
            assetPoolFactory.options.address,
            assetPoolFactory.methods.deployAssetPool(),
            req.body.network,
        );
        const events = parseLogs(Artifacts.IAssetPoolFactory.abi, tx.logs);
        const event = findEvent('AssetPoolDeployed', events);

        if (!event) {
            return next(
                new HttpError(
                    502,
                    'Could not find a confirmation event in factory transaction. Check API health status at /v1/health.',
                ),
            );
        }

        const solution = solutionContract(req.body.network, event.args.assetPool);

        await sendTransaction(
            solution.options.address,
            solution.methods.setPoolRegistry(
                req.body.network === NetworkProvider.Test ? TESTNET_POOL_REGISTRY_ADDRESS : POOL_REGISTRY_ADDRESS,
            ),
            req.body.network,
        );

        await sendTransaction(
            solution.options.address,
            solution.methods.initializeGasStation(adminAddress),
            req.body.network,
        );

        try {
            const assetPool = new AssetPool({
                address: solution.options.address,
                sub,
                blockNumber: event.blockNumber,
                transactionHash: event.transactionHash,
                bypassPolls: true,
                network: req.body.network,
            });

            const tokenAddress = await getTokenAddress(token, assetPool);

            await sendTransaction(solution.options.address, solution.methods.addToken(tokenAddress), req.body.network);

            try {
                const account = await Account.findById(sub);
                const erc20 = {
                    network: req.body.network,
                    address: tokenAddress,
                };

                if (account.erc20 && !account.erc20.find((r: { address: string }) => r.address === erc20.address)) {
                    account.erc20.push(erc20);
                } else {
                    account.erc20 = [erc20];
                }

                if (account.memberships) {
                    account.memberships.push(solution.options.address);
                } else {
                    account.memberships = [solution.options.address];
                }

                const rat = await getRegistrationAccessToken();

                if (rat.error) {
                    return next(new HttpError(500, rat.error));
                }

                if (account.registrationAccessTokens.length > 0) {
                    account.registrationAccessTokens.push(rat);
                } else {
                    account.registrationAccessTokens = [rat];
                }

                await account.save();

                assetPool.rat = rat;

                await assetPool.save();

                eventIndexer.addListener(assetPool.network, solution.options.address);

                res.status(201).json({ address: solution.options.address });
            } catch (e) {
                return next(new HttpError(502, 'Could not store the asset pool and account data.', e));
            }
        } catch (e) {
            return next(new HttpError(502, 'Could not add a token to the asset pool.'));
        }
    } catch (e) {
        return next(new HttpError(502, 'Could not deploy the asset pool on the network.', e));
    }
};
