import { Request, Response } from 'express';
import { param } from 'express-validator';
import { fromWei } from 'web3-utils';

import ERC20Service from '@/services/ERC20Service';
import ERC721Service from '@/services/ERC721Service';
import MemberService from '@/services/MemberService';
import WithdrawalService from '@/services/WithdrawalService';
import { ForbiddenError } from '@/util/errors';

export const validation = [param('id').isMongoId()];

export const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['Pools']
    if (req.assetPool.sub !== req.auth.sub) throw new ForbiddenError('Only the pool owner can access this pool info');

    if (!req.assetPool.address) return res.json(req.assetPool.toJSON());

    let token;
    if (req.assetPool.variant === 'defaultPool') {
        token = await ERC20Service.findByPool(req.assetPool);
    }
    if (req.assetPool.variant === 'nftPool') {
        token = await ERC721Service.findByPool(req.assetPool);
    }
    const [totalSupplyInWei, poolBalanceInWei] = await Promise.all([
        token.contract.methods.totalSupply().call(),
        token.contract.methods.balanceOf(req.assetPool.address).call(),
    ]);
    const metrics = {
        withdrawals: await WithdrawalService.countByPool(req.assetPool),
        members: await MemberService.countByPool(req.assetPool),
    };

    res.json({
        ...req.assetPool.toJSON(),
        metrics,
        token: {
            ...token.toJSON(),
            totalSupply: Number(fromWei(totalSupplyInWei)),
            poolBalance: Number(fromWei(poolBalanceInWei)),
        },
    });
};

export default { controller, validation };
