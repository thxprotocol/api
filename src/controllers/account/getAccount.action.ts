import { Request, Response, NextFunction } from 'express';
import { HttpError } from '@/models/Error';
import AccountProxy from '@/proxies/AccountProxy';

export const getAccount = async (req: Request, res: Response, next: NextFunction) => {
    async function getAccount() {
        const { account, error } = await AccountProxy.getById(req.user.sub);
        if (error) throw new Error(error.message);
        return account;
    }

    try {
        const account = await getAccount();

        res.send({
            id: account.id,
            address: account.address,
            privateKey: account.privateKey,
        });
    } catch (error) {
        next(new HttpError(502, error.message, error));
    }
};
