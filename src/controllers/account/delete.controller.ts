import { Response, Request } from 'express';
import AccountProxy from '@/proxies/AccountProxy';

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['Account']
    await AccountProxy.remove(req.auth.sub);

    res.status(204).end();
};
export default { controller };
