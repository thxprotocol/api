import { Request, Response } from 'express';
import DepositService from '@/services/DepositService';

const controller = async (req: Request, res: Response) => {
    console.log('pooladdress', req.params.address)
    const response = await DepositService.getAllPaginated(
        { receiver: req.params.address },
        Number(req.query.page),
        Number(req.query.limit),
    );
    res.send(response);
};

export default { controller };
