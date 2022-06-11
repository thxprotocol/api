import { Request, Response } from 'express';
import { body } from 'express-validator';
import { fromWei } from 'web3-utils';
import ERC20Service from '@/services/ERC20Service';
import AccountProxy from '@/proxies/AccountProxy';
import { AccountPlanType, NetworkProvider } from '@/types/enums';
import { getProvider } from '@/util/network';

export const validation = [
    body('name').exists().isString(),
    body('symbol').exists().isString(),
    body('network').exists().isNumeric(),
    body('type').exists().isNumeric(),
    body('totalSupply').optional().isNumeric(),
];

export const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['ERC20']
    const account = await AccountProxy.getById(req.user.sub);

    if (account.plan === AccountPlanType.Free && req.body.network === NetworkProvider.Main) {
        await AccountProxy.update(account.id, { plan: AccountPlanType.Basic });
    }

    const erc20 = await ERC20Service.deploy({
        name: req.body.name,
        symbol: req.body.symbol,
        network: req.body.network,
        totalSupply: req.body.totalSupply,
        type: req.body.type,
        sub: req.user.sub,
    });
    const totalSupply = Number(fromWei(await erc20.contract.methods.totalSupply().call(), 'ether'));
    const decimals = Number(await erc20.contract.methods.decimals().call());
    const { admin } = getProvider(erc20.network);
    const adminBalance = Number(fromWei(await erc20.contract.methods.balanceOf(admin.address).call(), 'ether'));

    res.status(201).json({
        ...erc20.toJSON(),
        totalSupply,
        decimals,
        adminBalance,
    });
};
export default { controller, validation };
