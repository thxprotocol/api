import { Request, Response, NextFunction } from 'express';
import ClientService from '@/services/ClientService';
import { HttpError } from '@/models/Error';
import AssetPoolService from '@/services/AssetPoolService';

export const getAssetPool = async (req: Request, res: Response, next: NextFunction) => {
    async function getByAddress() {
        const { assetPool, error } = await AssetPoolService.getByAddress(req.params.address);

        if (error) throw new Error(error.message);

        return assetPool;
    }

    async function getPoolToken() {
        const { token, error } = await AssetPoolService.getPoolToken(req.assetPool);

        if (error) throw new Error(error.message);

        return token;
    }

    async function getClient(clientId: string) {
        const { client, error } = await ClientService.get(clientId);

        if (error) throw new Error(error.message);

        return client;
    }

    try {
        const assetPool = await getByAddress();
        const token = await getPoolToken();
        const client = await getClient(assetPool.clientId);

        res.json({
            address: req.params.address,
            ...{
                sub: assetPool.sub,
                clientId: assetPool.clientId,
                clientSecret: client.clientSecret,
                address: assetPool.address,
                network: assetPool.network,
                bypassPolls: assetPool.bypassPolls,
                proposeWithdrawPollDuration: assetPool.proposeWithdrawPollDuration,
                rewardPollDuration: assetPool.rewardPollDuration,
            },
            token,
        });
    } catch (error) {
        return next(new HttpError(500, error.message, error));
    }
};
