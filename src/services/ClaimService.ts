import { AssetPoolDocument } from '@/models/AssetPool';
import { ClaimDocument, Claim } from '@/models/Claim';
import { TClaimURLData } from '@/types/TClaimURLData';
import { NotFoundError } from '@/util/errors';
import ERC20Service from './ERC20Service';
import ERC721Service from './ERC721Service';
import RewardService from './RewardService';

export default class ClaimService {
    static async get(assetPool: AssetPoolDocument, claimId: number): Promise<ClaimDocument> {
        const claim = await Claim.findOne({ poolId: String(assetPool._id), id: claimId });
        if (!claim) return null;
        return claim;
    }

    static async getClaimURLData(assetPool: AssetPoolDocument, rewardId: number): Promise<TClaimURLData> {
        const claim = await Claim.findOne({ poolId: String(assetPool._id), rewardId });

        if (!claim) {
            throw new NotFoundError('Could not find Claim');
        }

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

        return result;
    }
}
