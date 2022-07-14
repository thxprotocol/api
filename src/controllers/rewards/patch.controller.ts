import RewardService from '@/services/RewardService';
import { NotFoundError } from '@/util/errors';
import { Request, Response } from 'express';
import { body, param } from 'express-validator';

const validation = [
    param('id').exists(),
    body('withdrawAmount').optional().isNumeric(),
    body('withdrawDuration').optional().isNumeric(),
];

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['Rewards']
    const reward = await RewardService.get(req.assetPool, req.params.id);
    if (!reward) throw new NotFoundError('Could not find reward for this id');
    const result = await RewardService.update(reward, req.body);
    return res.json(result);
};

export default { controller, validation };
