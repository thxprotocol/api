import { Request, Response } from 'express';
import { param } from 'express-validator';
import { fromWei } from 'web3-utils';
import { NotFoundError } from '@/util/errors';
import MembershipService from '@/services/MembershipService';
import WithdrawalService from '@/services/WithdrawalService';
import AccountProxy from '@/proxies/AccountProxy';
import ERC721Service from '@/services/ERC721Service';
import AssetPoolService from '@/services/AssetPoolService';

const validation = [param('id').isMongoId()];

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['Memberships']
    const membership = await MembershipService.getById(req.params.id);
    if (!membership) throw new NotFoundError();

    const account = await AccountProxy.getById(req.auth.sub);
    if (!account) throw new NotFoundError('No Account');

    const assetPool = await AssetPoolService.getById(membership.poolId);

    let poolBalance;
    if (assetPool && assetPool.variant === 'defaultPool') {
        const balanceInWei = await assetPool.contract.methods.getBalance().call();
        poolBalance = Number(fromWei(balanceInWei));
    }

    let pendingBalance;
    if (membership.erc20) {
        pendingBalance = await WithdrawalService.getPendingBalance(account, membership.poolAddress);
    }

    let tokens;
    if (membership.erc721) {
        tokens = await ERC721Service.findTokensByRecipient(account.address, membership.erc721);
    }

    return res.json({
        id: String(membership._id),
        ...membership.toJSON(),
        poolBalance,
        pendingBalance,
        tokens,
    });
};

export default { controller, validation };
