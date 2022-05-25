import { Request, Response } from 'express';
import { param } from 'express-validator';
import ClientService from '@/services/ClientService';
import WithdrawalService from '@/services/WithdrawalService';
import MemberService from '@/services/MemberService';
import ERC20Service from '@/services/ERC20Service';
import ERC721Service from '@/services/ERC721Service';
import { ForbiddenError } from '@/util/errors';

export const validation = [param('id').isMongoId()];

export const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['Pools']
    if (req.assetPool.sub !== req.user.sub) throw new ForbiddenError('Only the pool owner can access this pool info');

    let token;
    if (req.assetPool.variant === 'defaultPool') {
        token = await ERC20Service.findByPool(req.assetPool);
    }
    if (req.assetPool.variant === 'nftPool') {
        token = await ERC721Service.findByPool(req.assetPool);
    }

    const client = await ClientService.get(req.assetPool.clientId);
    const metrics = {
        withdrawals: await WithdrawalService.countByPoolAddress(req.assetPool),
        members: await MemberService.countByPoolAddress(req.assetPool),
    };

    res.json({
        token,
        metrics,
        ...req.assetPool.toJSON(),
        clientSecret: client.clientSecret,
    });
};

export default { controller, validation };
