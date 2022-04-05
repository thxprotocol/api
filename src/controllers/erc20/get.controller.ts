import { Request, Response } from 'express';
import ERC20Service from '@/services/ERC20Service';
import { param } from 'express-validator';
import { AccountPlanType, NetworkProvider } from '@/types/enums';
import AccountProxy from '@/proxies/AccountProxy';
import { ForbiddenError } from '@/util/errors';

export const getERC20TokenValidation = [param('id').exists().isMongoId()];

export const getById = async (req: Request, res: Response) => {
    const account = await AccountProxy.getById(req.user.sub);
    const token = await ERC20Service.getById(req.params.id);

    if (
        ![AccountPlanType.Basic, AccountPlanType.Premium].includes(account.plan) &&
        token.network === NetworkProvider.Main
    ) {
        throw new ForbiddenError('Active plan of this pool owner is not sufficient.');
    }

    return res.send(await token.getResponse());
};
