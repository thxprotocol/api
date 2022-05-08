import { Response, Request } from 'express';
import AccountProxy from '@/proxies/AccountProxy';

export const deleteAccount = async (req: Request, res: Response) => {
    // #swagger.tags = ['Account']
    await AccountProxy.remove(req.user.sub);

    res.status(204).end();
};
