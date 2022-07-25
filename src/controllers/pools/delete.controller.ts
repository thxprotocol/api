import { Request, Response } from 'express';
import { param } from 'express-validator';

import ClientProxy from '@/proxies/ClientProxy';
import AssetPoolService from '@/services/AssetPoolService';
import RewardService from '@/services/RewardService';
import WithdrawalService from '@/services/WithdrawalService';

const validation = [param('id').isMongoId()];

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['Pools']
    await RewardService.removeAllForPool(req.assetPool);
    await WithdrawalService.removeAllForPool(req.assetPool);
    await ClientProxy.remove(req.assetPool.clientId);
    await AssetPoolService.remove(req.assetPool);

    res.status(204).end();
};

export default { controller, validation };
