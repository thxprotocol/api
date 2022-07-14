import { Request, Response } from 'express';
import { body, param } from 'express-validator';
import { BadRequestError, ForbiddenError } from '@/util/errors';
import { WithdrawalState, WithdrawalType } from '@/types/enums';
import { WithdrawalDocument } from '@/models/Withdrawal';
import { agenda, EVENT_REQUIRE_TRANSACTIONS } from '@/util/agenda';
import AccountProxy from '@/proxies/AccountProxy';
import RewardService from '@/services/RewardService';
import MemberService from '@/services/MemberService';
import WithdrawalService from '@/services/WithdrawalService';
import MembershipService from '@/services/MembershipService';
import ERC721Service from '@/services/ERC721Service';
import AssetPoolService from '@/services/AssetPoolService';
import { Claim } from '@/models/Claim';
import ERC20Service from '@/services/ERC20Service';

const validation = [param('id').isMongoId()];

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['Rewards']
    if (!req.auth.sub) throw new BadRequestError('No subscription is found for this type of access token.');

    const claim = await Claim.findById(req.params.id);
    if (!claim) throw new BadRequestError('The claim for this claimId does not exist.');

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
        if (pool.variant === 'defaultPool') {
            await MembershipService.addERC20Membership(account.id, pool);
        }
        if (pool.variant === 'nftPool') {
            await MembershipService.addERC721Membership(account.id, pool);
        }
    }

    if (pool.variant === 'defaultPool') {
        const w: WithdrawalDocument = await WithdrawalService.schedule(
            pool,
            WithdrawalType.ClaimReward,
            req.auth.sub,
            reward.withdrawAmount,
            WithdrawalState.Pending,
            reward.withdrawUnlockDate,
            reward.id,
        );
        const erc20 = await ERC20Service.getById(claim.erc20Id);

        await WithdrawalService.proposeWithdraw(pool, w, account);

        agenda.now(EVENT_REQUIRE_TRANSACTIONS, {});

        return res.json({ ...w.toJSON(), tokenSymbol: erc20.symbol });
    }

    if (pool.variant === 'nftPool') {
        const metadata = await ERC721Service.findMetadataById(reward.erc721metadataId);
        const erc721 = await ERC721Service.findById(metadata.erc721);
        const token = await ERC721Service.mint(pool, erc721, metadata, account);

        agenda.now(EVENT_REQUIRE_TRANSACTIONS, {});

        return res.json({ ...token.toJSON(), metadata: metadata.toJSON() });
    }
};

export default { controller, validation };