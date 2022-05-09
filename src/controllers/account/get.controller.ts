import { Request, Response } from 'express';
import { param } from 'express-validator';
import AccountProxy from '@/proxies/AccountProxy';

const validation = [param('id').isMongoId()];

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['Account']
    const account = await AccountProxy.getById(req.user.sub);

    res.send({
        id: account.id,
        address: account.address,
        firstName: account.firstName,
        lastName: account.lastName,
        company: account.company,
        plan: account.plan,
        privateKey: account.privateKey,
    });
};
export default { controller, validation };
