import { Request, Response } from 'express';
import { body, param } from 'express-validator';
import { BadRequestError, InsufficientBalanceError } from '@/util/errors';
import { toWei } from 'web3-utils';
import { getProvider } from '@/util/network';
import { ethers } from 'ethers';
import { ERC20Type } from '@/types/enums';
import ERC20Service from '@/services/ERC20Service';
import TransactionService from '@/services/TransactionService';
import AssetPoolService from '@/services/AssetPoolService';

export const validation = [param('id').isMongoId(), body('amount').isInt({ gt: 0 })];

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['Pools']
    const { admin } = getProvider(req.assetPool.chainId);
    const amount = toWei(String(req.body.amount));
    const erc20 = await ERC20Service.findByPool(req.assetPool);

    if (erc20.type !== ERC20Type.Limited) throw new BadRequestError('Token type is not Limited type');

    // Check balance to ensure throughput
    const balance = await erc20.contract.methods.balanceOf(admin.address).call();
    if (Number(balance) < Number(amount)) throw new InsufficientBalanceError();

    // Check allowance for admin to ensure throughput
    const allowance = await erc20.contract.methods.allowance(admin.address, req.assetPool.address).call();
    if (Number(allowance) < Number(amount)) {
        await TransactionService.send(
            erc20.contract.options.address,
            erc20.contract.methods.approve(req.assetPool.address, ethers.constants.MaxUint256),
            req.assetPool.chainId,
        );
    }

    const topup = await AssetPoolService.topup(req.assetPool, amount);

    res.json(topup);
};

export default { validation, controller };
