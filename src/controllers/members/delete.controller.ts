import { Request, Response } from 'express';
import { param } from 'express-validator';
import MemberService from '@/services/MemberService';
import AccountProxy from '@/proxies/AccountProxy';
import MembershipService from '@/services/MembershipService';
import { NotFoundError } from '@/util/errors';

const validation = [param('address').isEthereumAddress()];

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['Members']
    const isMember = await MemberService.isMember(req.assetPool, req.params.address);
    if (!isMember) throw new NotFoundError();

    await MemberService.removeMember(req.assetPool, req.params.address);

    const account = await AccountProxy.getByAddress(req.params.address);
    await MembershipService.removeMembership(account.id, req.assetPool);

    res.status(204).end();
};

export default { controller, validation };
