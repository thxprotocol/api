import { Request, Response } from 'express';
import { param } from 'express-validator';
import AssetPoolService from '@/services/AssetPoolService';
import ClientService from '@/services/ClientService';

export const readAssetPoolValidation = [param('address').exists().isEthereumAddress()];

export const getAssetPool = async (req: Request, res: Response) => {
    const { assetPool } = await AssetPoolService.getByAddress(req.params.address);
    const { token } = await AssetPoolService.getPoolToken(req.assetPool);
    const { client } = await ClientService.get(assetPool.clientId);

    res.json({
        address: req.params.address,
        token,
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
    });
};
