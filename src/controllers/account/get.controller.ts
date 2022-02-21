import { Request, Response } from 'express';
import { param } from 'express-validator';
import AccountProxy from '@/proxies/AccountProxy';

export const readAccountValidation = [param('id').exists()];

export const getAccount = async (req: Request, res: Response) => {
    const account = await AccountProxy.getById(req.user.sub);

    res.send({
        id: account.id,
        address: account.address,
        privateKey: account.privateKey,
    });
};
