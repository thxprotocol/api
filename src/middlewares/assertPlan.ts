import AccountProxy from '@/proxies/AccountProxy';
import { AccountPlanType, ChainId } from '@/types/enums';
import { ForbiddenError } from '@/util/errors';
import { Response, Request, NextFunction } from 'express';

export function assertPlan(plans: AccountPlanType[]) {
    return async (req: Request, res: Response, next: NextFunction) => {
        const account = await AccountProxy.getById(req.assetPool.sub);
        if (!plans.includes(account.plan) && req.assetPool.chainId === ChainId.Polygon) {
            throw new ForbiddenError('Active plan of this pool owner is not sufficient.');
        }
        next();
    };
}
