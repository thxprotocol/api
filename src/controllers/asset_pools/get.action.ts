import { Request, Response } from 'express';
import { param } from 'express-validator';
import AssetPoolService from '@/services/AssetPoolService';
import ClientService from '@/services/ClientService';
import { NotFoundError } from '@/util/errors';
import WithdrawalService from '@/services/WithdrawalService';
import MemberService from '@/services/MemberService';
import ERC20Service from '@/services/ERC20Service';
import { fromWei } from 'web3-utils';

export const readAssetPoolValidation = [param('address').exists().isEthereumAddress()];

export const getAssetPool = async (req: Request, res: Response) => {
    const assetPool = await AssetPoolService.getByAddress(req.params.address);
    if (!assetPool) throw new NotFoundError();

    const token = await ERC20Service.findByPool(req.assetPool);
    const client = await ClientService.get(assetPool.clientId);
    const metrics = {
        withdrawals: await WithdrawalService.countByPoolAddress(assetPool),
        members: await MemberService.countByPoolAddress(assetPool),
    };
    const balanceInWei = await token.contract.methods.balanceOf(req.assetPool.address).call();

    res.json({
        token,
        balance: Number(fromWei(balanceInWei)),
        metrics,
        sub: assetPool.sub,
        clientId: assetPool.clientId,
        clientSecret: client.clientSecret,
        address: assetPool.address,
        network: assetPool.network,
        version: assetPool.version,
    });
};
