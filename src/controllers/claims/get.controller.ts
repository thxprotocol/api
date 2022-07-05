import { Request, Response } from 'express';
import { NotFoundError } from '@/util/errors';
import { param } from 'express-validator';
import { Claim } from '@/models/Claim';
import RewardService from '@/services/RewardService';
import ERC20Service from '@/services/ERC20Service';
import ERC721Service from '@/services/ERC721Service';

const validation = [param('id').exists()];

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['Claims']

    const claim = await Claim.findById(req.params.id);

    if (!claim) throw new NotFoundError('Coudl not find Claim');
    const assetPool = req.assetPool;

    const reward = await RewardService.get(assetPool, Number(claim.rewardId));

    let tokenSymbol;
    if (claim.erc20Id) {
        const erc20 = await ERC20Service.getById(claim.erc20Id);
        tokenSymbol = erc20.symbol;
    } else if (claim.erc721Id) {
        const erc721 = await ERC721Service.findById(claim.erc721Id);
        tokenSymbol = erc721.symbol;
    }
    const result = {
        _id: claim._id,
        poolId: claim.poolId,
        erc20Id: claim.erc20Id,
        erc721Id: claim.erc721Id,
        rewardId: claim.rewardId,
        withdrawAmount: reward.withdrawAmount,
        withdrawCondition: reward.withdrawCondition,
        chainId: assetPool.chainId,
        clientId: assetPool.clientId,
        poolAddress: assetPool.address,
        tokenSymbol,
    };

    res.json(result);
};

export default { controller, validation };
