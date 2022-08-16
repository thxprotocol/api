import { Request, Response } from 'express';
import ERC20Service from '@/services/ERC20Service';
import { param } from 'express-validator';
import { fromWei } from 'web3-utils';
import { getProvider } from '@/util/network';
import { NotFoundError } from '@/util/errors';

const validation = [param('id').exists().isMongoId()];

const controller = async (req: Request, res: Response) => {
    /*
    #swagger.tags = ['ERC20 Contract']
    #swagger.responses[200] = { 
            description: 'Get an ERC20 contract for this user.',
            schema: { $ref: '#/definitions/ERC20' } 
    }
    */
    const erc20 = await ERC20Service.getById(req.params.id);
    if (!erc20) new NotFoundError('ERC20 not found');
    if (!erc20.address) return res.send(erc20);

    const { defaultAccount } = getProvider(erc20.chainId);
    const [totalSupplyInWei, decimalsString, adminBalanceInWei] = await Promise.all([
        erc20.contract.methods.totalSupply().call(),
        erc20.contract.methods.decimals().call(),
        erc20.contract.methods.balanceOf(defaultAccount).call(),
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
