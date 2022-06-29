import { Request, Response } from 'express';
import { param } from 'express-validator';
import RewardService from '@/services/RewardService';
import WithdrawalService from '@/services/WithdrawalService';
import ClientService from '@/services/ClientService';
import AssetPoolService from '@/services/AssetPoolService';

const validation = [param('id').isMongoId()];

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['Pools']
    await RewardService.removeAllForPool(req.assetPool);
    await WithdrawalService.removeAllForPool(req.assetPool);
    await ClientService.remove(req.assetPool.clientId);
    await AssetPoolService.remove(req.assetPool);

    res.status(204).end();
};

export default { controller, validation };
