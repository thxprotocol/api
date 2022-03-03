import AssetPoolService from '@/services/AssetPoolService';
import { updateToVersion } from '@/util/upgrades';
import Bluebird from 'bluebird';
import { Response, Request } from 'express';

export const getAssetPoolVersions = async (req: Request, res: Response) => {
    const assetPools = await AssetPoolService.getAll();

    const data: Record<string, any> = {};
    assetPools.forEach((assetPool) => {
        data[assetPool.address] = AssetPoolService.contractVersion(assetPool);
    });
    updateToVersion(assetPools[0], '1.0.6');

    res.header('Content-Type', 'application/json').send(JSON.stringify(await Bluebird.props(data), null, 4));
};
