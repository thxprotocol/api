import { Request, Response } from 'express';
import { param } from 'express-validator';
import { fromWei } from 'web3-utils';
import { NotFoundError } from '@/util/errors';
import MemberService from '@/services/MemberService';
import ERC20Service from '@/services/ERC20Service';
import { getContractFromName } from '@/config/contracts';

const validation = [param('address').isEthereumAddress()];

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['Members']
    const isMember = await MemberService.isMember(req.assetPool, req.params.address);

    if (!isMember) throw new NotFoundError();

    const member = await MemberService.getByAddress(req.assetPool, req.params.address);
    console.log(req.assetPool);
    const erc20 = await ERC20Service.findByPool(req.assetPool);
    const contract = getContractFromName(req.assetPool.network, 'LimitedSupplyToken', erc20.address);
    const balance = Number(fromWei(await contract.methods.balanceOf(member.address).call()));

    res.json({ ...member, token: { name: erc20.name, symbol: erc20.symbol, balance } });
};

export default { controller, validation };
