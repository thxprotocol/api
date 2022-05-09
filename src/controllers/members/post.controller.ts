import MemberService from '@/services/MemberService';
import MembershipService from '@/services/MembershipService';
import AccountProxy from '@/proxies/AccountProxy';
import { Request, Response } from 'express';
import { VERSION } from '@/config/secrets';
import { AlreadyAMemberError } from '@/util/errors';
import { body } from 'express-validator';

const validation = [body('address').isEthereumAddress()];

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['Members']
    const account = await AccountProxy.getByAddress(req.body.address);
    const isMember = await MemberService.isMember(req.assetPool, account.address);
    if (isMember) throw new AlreadyAMemberError(account.address, req.assetPool.address);

    await MemberService.addMember(req.assetPool, req.body.address);
    if (req.assetPool.variant === 'defaultPool') {
        await MembershipService.addERC20Membership(account.id, req.assetPool);
    }

    if (req.assetPool.variant === 'nftPool') {
        await MembershipService.addERC721Membership(account.id, req.assetPool);
    }

    res.redirect(`/${VERSION}/members/${account.address}`);
};

export default { controller, validation };
