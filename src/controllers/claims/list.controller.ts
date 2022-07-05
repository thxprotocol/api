import { Request, Response } from 'express';
import { param } from 'express-validator';
import { Claim } from '@/models/Claim';
import ERC20Service from '@/services/ERC20Service';
import ERC721Service from '@/services/ERC721Service';
import RewardService from '@/services/RewardService';
import { TClaimURLData } from '@/types/TClaimURLData';

const validation = [param('id').isNumeric().exists()];

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['Claims']
    const assetPool = req.assetPool;
    const rewardId = req.params.id;
    const claims = await Claim.find({ poolId: String(assetPool._id), rewardId });

    const results = [];
    for (let i = 0; i < claims.length; i++) {
        const claim = claims[i];
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
        } as TClaimURLData;
        results.push(result);
    }

    res.json(results);
};

export default { controller, validation };
