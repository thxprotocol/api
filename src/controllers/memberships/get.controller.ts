import { Request, Response } from 'express';
import { param } from 'express-validator';
import MembershipService from '@/services/MembershipService';
import WithdrawalService from '@/services/WithdrawalService';
import AccountProxy from '@/proxies/AccountProxy';
import { NotFoundError } from '@/util/errors';
import ERC721Service from '@/services/ERC721Service';

const validation = [param('id').isMongoId()];

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['Memberships']
    const membership = await MembershipService.getById(req.params.id);
    if (!membership) throw new NotFoundError();

    const account = await AccountProxy.getById(req.user.sub);
    if (!account) throw new NotFoundError('No Account');

    if (membership.erc20) {
        const pending = await WithdrawalService.getPendingBalance(account, membership.poolAddress);
        return res.json({ ...membership, pendingBalance: pending });
    }

    if (membership.erc721) {
        const tokens = await ERC721Service.findTokensByRecipient(account.address, membership.erc721);

        return res.json({
            ...membership,
            tokens,
        });
    }

    res.json(membership);
};

export default { controller, validation };
