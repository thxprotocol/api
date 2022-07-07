import { Request, Response } from 'express';
import RewardService from '@/services/RewardService';
import { NotFoundError } from '@/util/errors';
import { param } from 'express-validator';
import WithdrawalService from '@/services/WithdrawalService';

const validation = [param('id').exists().isNumeric()];

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['Rewards']
    const reward = await RewardService.get(req.assetPool, Number(req.params.id));
    if (!reward) throw new NotFoundError();
    const withdrawals = await WithdrawalService.findByQuery({
        poolId: String(req.assetPool._id),
        rewardId: reward.id,
    });

    res.json({ ...reward.toJSON(), poolAddress: req.assetPool.address, progress: withdrawals.length });
};

export default { controller, validation };
