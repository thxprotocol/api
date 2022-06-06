import { Request, Response } from 'express';
import ERC20Service from '@/services/ERC20Service';
import { param } from 'express-validator';
import { fromWei } from 'web3-utils';
import { getProvider } from '@/util/network';
import { NotFoundError } from '@/util/errors';

const validation = [param('id').exists().isMongoId()];

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['ERC20']
    const erc20 = await ERC20Service.getById(req.params.id);
    if (!erc20) new NotFoundError('ERC20 not found');

    const { admin } = getProvider(erc20.network);
    const [totalSupplyInWei, decimalsString, adminBalanceInWei] = await Promise.all([
        erc20.contract.methods.totalSupply().call(),
        erc20.contract.methods.decimals().call(),
        erc20.contract.methods.balanceOf(admin.address).call(),
    ]);
    const totalSupply = Number(fromWei(totalSupplyInWei, 'ether'));
    const decimals = Number(decimalsString);
    const adminBalance = Number(fromWei(adminBalanceInWei, 'ether'));

    res.status(200).json({
        ...erc20.toJSON(),
        totalSupply,
        decimals,
        adminBalance,
    });
};

export default { controller, validation };
