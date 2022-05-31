import { Request, Response } from 'express';
import DepositService from '@/services/DepositService';
import { NotFoundError } from '@/util/errors';
import { param } from 'express-validator';
import { TDeposit } from '@/types/TDeposit';

const validation = [param('id').exists().isNumeric()];

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['Deposits']
    const deposit = await DepositService.get(req.assetPool, Number(req.params.id));
    if (!deposit) throw new NotFoundError();

    const result: TDeposit = {
        ...deposit,
    };

    res.json(result);
};

export default { controller, validation };
