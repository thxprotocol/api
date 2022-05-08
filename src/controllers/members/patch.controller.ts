import { Request, Response } from 'express';
import { VERSION } from '@/config/secrets';
import { NotFoundError } from '@/util/errors';
import TransactionService from '@/services/TransactionService';

export const patchMember = async (req: Request, res: Response) => {
    // #swagger.tags = ['Members']
    const isMember = await TransactionService.call(
        req.assetPool.contract.methods.isMember(req.params.address),
        req.assetPool.network,
    );
    if (!isMember) throw new NotFoundError();

    await TransactionService.send(
        req.assetPool.address,
        req.assetPool.contract.methods[req.body.isManager ? 'addManager' : 'removeManager'](req.params.address),
        req.assetPool.network,
    );

    res.redirect(`/${VERSION}/members/${req.params.address}`);
};
