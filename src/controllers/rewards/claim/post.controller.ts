import { Request, Response } from 'express';
import { param } from 'express-validator';
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

const validation = [param('id').exists().isNumeric()];

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['Rewards']
    if (!req.auth.sub) throw new BadRequestError('No subscription is found for this type of access token.');

    const rewardId = Number(req.params.id);
    const reward = await RewardService.get(req.assetPool, rewardId);
    if (!reward) throw new BadRequestError('The reward for this ID does not exist.');

    const account = await AccountProxy.getById(req.auth.sub);
    if (!account.address) throw new BadRequestError('The authenticated account has not accessed its wallet.');

    const { result, error } = await RewardService.canClaim(req.assetPool, reward, account);
    if (!result && error) throw new ForbiddenError(error);

    // TODO add MemberAccess facets to NFTPools and remove this check
    if (req.assetPool.variant === 'defaultPool') {
        const isMember = await MemberService.isMember(req.assetPool, account.address);
        if (!isMember && reward.isMembershipRequired)
            throw new ForbiddenError('Could not claim this reward since you are not a member of the pool.');
    }

    const hasMembership = await MembershipService.hasMembership(req.assetPool, account.id);
    if (!hasMembership && !reward.isMembershipRequired) {
        if (req.assetPool.variant === 'defaultPool') {
            await MembershipService.addERC20Membership(account.id, req.assetPool);
        }
        if (req.assetPool.variant === 'nftPool') {
            await MembershipService.addERC721Membership(account.id, req.assetPool);
        }
    }

    if (req.assetPool.variant === 'defaultPool') {
        const w: WithdrawalDocument = await WithdrawalService.schedule(
            req.assetPool,
            WithdrawalType.ClaimReward,
            req.auth.sub,
            reward.withdrawAmount,
            WithdrawalState.Pending,
            reward.withdrawUnlockDate,
            reward.id,
        );

        await WithdrawalService.proposeWithdraw(req.assetPool, w, account);

        agenda.now(EVENT_REQUIRE_TRANSACTIONS, {});

        return res.json({ ...w.toJSON() });
    }

    if (req.assetPool.variant === 'nftPool') {
        const metadata = await ERC721Service.findMetadataById(reward.erc721metadataId);
        const erc721 = await ERC721Service.findById(metadata.erc721);
        const token = await ERC721Service.mint(req.assetPool, erc721, metadata, account);

        agenda.now(EVENT_REQUIRE_TRANSACTIONS, {});

        return res.json({ ...token.toJSON(), metadata: metadata.toJSON() });
    }
};

export default { controller, validation };
