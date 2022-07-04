import { Request, Response } from 'express';
import { NotFoundError } from '@/util/errors';
import { param } from 'express-validator';
import ClaimService from '@/services/ClaimService';

const validation = [param('rewardId').isNumeric().exists()];

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['Claims']
    const claimURLData = await ClaimService.getClaimURLData(req.assetPool, Number(req.params.rewardId));
    if (!claimURLData) throw new NotFoundError();

    res.json(claimURLData);
};

export default { controller, validation };
