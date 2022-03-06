import RewardService from '@/services/RewardService';
import { NotFoundError } from '@/util/errors';
import { Request, Response } from 'express';

export async function patchReward(req: Request, res: Response) {
    const reward = await RewardService.get(req.assetPool, Number(req.params.id));
    if (!reward) throw new NotFoundError('Could not find reward for this id');
    const result = await RewardService.update(reward, req.body);
    return res.json(result);
}
