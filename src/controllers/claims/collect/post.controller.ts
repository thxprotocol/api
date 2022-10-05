import { Request, Response } from 'express';
import { param } from 'express-validator';
import { BadRequestError, ForbiddenError } from '@/util/errors';
import { WithdrawalState, WithdrawalType } from '@/types/enums';
import { WithdrawalDocument } from '@/models/Withdrawal';
import AccountProxy from '@/proxies/AccountProxy';
import RewardService from '@/services/RewardService';
import MemberService from '@/services/MemberService';
import WithdrawalService from '@/services/WithdrawalService';
import MembershipService from '@/services/MembershipService';
import ERC721Service from '@/services/ERC721Service';
import AssetPoolService from '@/services/AssetPoolService';
import { Claim } from '@/models/Claim';
import ERC20Service from '@/services/ERC20Service';
import ClaimService from '@/services/ClaimService';

const validation = [param('id').exists().isString()];

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['Rewards']
    let claim = await ClaimService.findById(req.params.id);
    if (!claim) {
        // maintain compatibility with old the claim urls
        claim = await Claim.findById(req.params.id);
    }
    if (!claim) throw new BadRequestError('This claim URL is invalid.');

    const pool = await AssetPoolService.getById(claim.poolId);
    if (!pool) throw new BadRequestError('The pool for this rewards has been removed.');

    const reward = await RewardService.get(pool, claim.rewardId);
    if (!reward) throw new BadRequestError('The reward for this ID does not exist.');

    const account = await AccountProxy.getById(req.auth.sub);
    if (!account.address) throw new BadRequestError('The authenticated account has not accessed its wallet.');

    const { result, error } = await RewardService.canClaim(pool, reward, account);
    if (!result && error) throw new ForbiddenError(error);

    const isMember = await MemberService.isMember(pool, account.address);
    if (!isMember && reward.isMembershipRequired) throw new ForbiddenError('You are not a member of this pool.');

    const hasMembership = await MembershipService.hasMembership(pool, account.id);
    if (!hasMembership && !reward.isMembershipRequired) {
        if (claim.erc20Id) {
            await MembershipService.addERC20Membership(account.id, pool);
        }
        if (claim.erc721Id) {
            await MembershipService.addERC721Membership(account.id, pool);
        }
    }

    if (claim.erc20Id) {
        let w: WithdrawalDocument = await WithdrawalService.schedule(
            pool,
            WithdrawalType.ClaimReward,
            req.auth.sub,
            reward.withdrawAmount,
            WithdrawalState.Pending,
            reward.withdrawUnlockDate,
            reward.id,
        );
        const erc20 = await ERC20Service.getById(claim.erc20Id);

        w = await WithdrawalService.withdrawFor(pool, w, account);

        return res.json({ ...w.toJSON(), erc20 });
    }

    if (claim.erc721Id) {
        const metadata = await ERC721Service.findMetadataById(reward.erc721metadataId);
        const erc721 = await ERC721Service.findById(metadata.erc721);
        const token = await ERC721Service.mint(pool, erc721, metadata, account);

        return res.json({ ...token.toJSON(), erc721: erc721.toJSON(), metadata: metadata.toJSON() });
    }
};

export default { controller, validation };
