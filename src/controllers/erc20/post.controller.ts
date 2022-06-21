import { Request, Response } from 'express';
import { body } from 'express-validator';
import ERC20Service from '@/services/ERC20Service';
import AccountProxy from '@/proxies/AccountProxy';
import { checkAndUpgradeToBasicPlan } from '@/util/plans';
// import { fromWei } from 'web3-utils';
// import { getProvider } from '@/util/network';

export const validation = [
    body('name').exists().isString(),
    body('symbol').exists().isString(),
    body('chainId').exists().isNumeric(),
    body('type').exists().isNumeric(),
    body('totalSupply').optional().isNumeric(),
];

export const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['ERC20']
    const account = await AccountProxy.getById(req.auth.sub);

    await checkAndUpgradeToBasicPlan(account, req.body.chainId);

    const erc20 = await ERC20Service.deploy({
        name: req.body.name,
        symbol: req.body.symbol,
        chainId: req.body.chainId,
        totalSupply: req.body.totalSupply,
        type: req.body.type,
        sub: req.auth.sub,
    });
    // const totalSupply = Number(fromWei(await erc20.contract.methods.totalSupply().call(), 'ether'));
    // const decimals = Number(await erc20.contract.methods.decimals().call());
    // const { admin } = getProvider(erc20.chainId);
    // const adminBalance = Number(fromWei(await erc20.contract.methods.balanceOf(admin.address).call(), 'ether'));

    res.status(201).json(
        erc20,
        // {
        // ...erc20.toJSON(),
        // totalSupply,
        // decimals,
        // adminBalance,
        // }
    );
};
export default { controller, validation };
