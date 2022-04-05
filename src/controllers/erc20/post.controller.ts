import { Request, Response } from 'express';
import { body } from 'express-validator';
import ERC20Service from '@/services/ERC20Service';
import AccountProxy from '@/proxies/AccountProxy';
import { AccountPlanType, NetworkProvider } from '@/types/enums';

export const postERC20TokenValidation = [
    body('name').exists().isString(),
    body('symbol').exists().isString(),
    body('network').exists().isNumeric(),
    body('totalSupply').optional().isNumeric(),
];

export const postCreateToken = async (req: Request, res: Response) => {
    const account = await AccountProxy.getById(req.user.sub);

    if (account.plan === AccountPlanType.Free && req.body.network === NetworkProvider.Main) {
        await AccountProxy.update(account.id, { plan: AccountPlanType.Basic });
    }

    const token = await ERC20Service.create({
        name: req.body['name'],
        symbol: req.body['symbol'],
        network: req.body['network'],
        totalSupply: req.body['totalSupply'],
        sub: req.user.sub,
    });

    return res.send(await token.getResponse());
};
