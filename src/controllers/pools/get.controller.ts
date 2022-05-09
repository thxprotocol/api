import { Request, Response } from 'express';
import { param } from 'express-validator';
import { NotFoundError } from '@/util/errors';
import AssetPoolService from '@/services/AssetPoolService';
import ClientService from '@/services/ClientService';
import WithdrawalService from '@/services/WithdrawalService';
import MemberService from '@/services/MemberService';
import ERC20Service from '@/services/ERC20Service';
import ERC721Service from '@/services/ERC721Service';

export const validation = [param('address').isEthereumAddress()];

export const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['Pools']
    const assetPool = await AssetPoolService.getByAddress(req.params.address);
    if (!assetPool) throw new NotFoundError();

    let token;
    if (assetPool.variant === 'defaultPool') {
        token = await ERC20Service.findByPool(assetPool);
    }
    if (assetPool.variant === 'nftPool') {
        token = await ERC721Service.findByQuery({ poolAddress: assetPool.address, network: assetPool.network });
    }

    const client = await ClientService.get(assetPool.clientId);
    const metrics = {
        withdrawals: await WithdrawalService.countByPoolAddress(assetPool),
        members: await MemberService.countByPoolAddress(assetPool),
    };

    res.json({
        token,
        metrics,
        sub: assetPool.sub,
        variant: assetPool.variant,
        clientId: assetPool.clientId,
        clientSecret: client.clientSecret,
        address: assetPool.address,
        network: assetPool.network,
        version: assetPool.version,
    });
};

export default { controller, validation };
