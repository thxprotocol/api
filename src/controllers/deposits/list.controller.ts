import { Request, Response } from 'express';
import DepositService from '@/services/DepositService';
import { TDeposit } from '@/types/TDeposit';

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['Deposits']
    const deposits = await DepositService.getAll(req.assetPool);
    const result = deposits.map(x => {
        const result: TDeposit = {
            id: x.id,
            sub: x.sub,
            amount: x.amount,
            sender: x.sender,
            receiver: x.receiver,
            state: x.state,
            transactions: x.transactions,
            item: x.item,
            failReason: x.failReason,
            createdAt: x.createdAt,
            updatedAt: x.updatedAt

        }; 
        return result;
    })

    res.json(result);
    console.log('REEEEEEEEEEEESSSSSSSSSSSSS', result)
};

export default { controller };
