import { Request, Response } from 'express';
import DepositService from '@/services/DepositService';
import { TDeposit } from '@/types/TDeposit';

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['Deposits']
    const deposits = await DepositService.getAll(req.assetPool);
    const result = deposits.map(deposit => {
        const result: TDeposit = {
            ...deposit
        }; 
        return result;
    })

    res.json(result);
};

export default { controller };
