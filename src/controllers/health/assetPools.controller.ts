import AssetPoolService from '@/services/AssetPoolService';
import Bluebird from 'bluebird';
import { Response, Request } from 'express';

export const getAssetPoolVersions = async (req: Request, res: Response) => {
    const assetPools = await AssetPoolService.getAll();

    const data: Record<string, any> = {};
    assetPools.forEach((assetPool) => {
        data[assetPool.address] = AssetPoolService.contractVersion(assetPool);
    });

    res.header('Content-Type', 'application/json').send(JSON.stringify(await Bluebird.props(data), null, 4));
};
