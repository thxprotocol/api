import { Request, Response } from 'express';
import { param } from 'express-validator';
import { isAddress } from 'web3-utils';
import RewardService from '@/services/RewardService';
import WithdrawalService from '@/services/WithdrawalService';
import ClientService from '@/services/ClientService';
import AssetPoolService from '@/services/AssetPoolService';

export const deleteAssetPoolValidation = [
    param('address')
        .exists()
        .custom((value) => {
            return isAddress(value);
        }),
];

export async function deleteAssetPool(req: Request, res: Response) {
    // #swagger.tags = ['Pools']
    await RewardService.removeAllForAddress(req.assetPool.address);
    await WithdrawalService.removeAllForAddress(req.assetPool.address);
    await ClientService.remove(req.assetPool.clientId);
    await AssetPoolService.removeByAddress(req.assetPool.address);

    res.status(204).end();
}
