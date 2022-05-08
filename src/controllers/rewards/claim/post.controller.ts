import { Request, Response } from 'express';
import { BadRequestError, ForbiddenError } from '@/util/errors';
import { WithdrawalState, WithdrawalType } from '@/types/enums';
import { TWithdrawal } from '@/types/TWithdrawal';
import AccountProxy from '@/proxies/AccountProxy';
import RewardService from '@/services/RewardService';
import MemberService from '@/services/MemberService';
import WithdrawalService from '@/services/WithdrawalService';
import MembershipService from '@/services/MembershipService';
import { WithdrawalDocument } from '@/models/Withdrawal';
import { agenda, eventNameRequireTransactions } from '@/util/agenda';
import ERC721Service from '@/services/ERC721Service';

const ERROR_REWARD_NOT_FOUND = 'The reward for this ID does not exist.';
const ERROR_ACCOUNT_NO_ADDRESS = 'The authenticated account has not wallet address. Sign in the Web Wallet once.';
const ERROR_INCORRECT_SCOPE = 'No subscription is found for this type of access token.';
const ERROR_NO_MEMBER = 'Could not claim this reward since you are not a member of the pool.';

export async function postRewardClaim(req: Request, res: Response) {
    // #swagger.tags = ['Rewards']
    if (!req.user.sub) throw new BadRequestError(ERROR_INCORRECT_SCOPE);

    const rewardId = Number(req.params.id);
    const reward = await RewardService.get(req.assetPool, rewardId);
    if (!reward) throw new BadRequestError(ERROR_REWARD_NOT_FOUND);

    const account = await AccountProxy.getById(req.user.sub);
    if (!account.address) throw new BadRequestError(ERROR_ACCOUNT_NO_ADDRESS);

    const { result, error } = await RewardService.canClaim(req.assetPool, reward, account);
    if (!result && error) throw new ForbiddenError(error);

    // TODO add MemberAccess facets to NFTPools and remove this check
    if (req.assetPool.variant === 'defaultPool') {
        const isMember = await MemberService.isMember(req.assetPool, account.address);
        if (!isMember && reward.isMembershipRequired) throw new ForbiddenError(ERROR_NO_MEMBER);
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
            req.user.sub,
            reward.withdrawAmount,
            WithdrawalState.Pending,
            reward.withdrawUnlockDate,
            reward.id,
        );

        await WithdrawalService.proposeWithdraw(req.assetPool, w, account);

        agenda.now(eventNameRequireTransactions, {});

        const response: TWithdrawal = {
            id: String(w._id),
            sub: w.sub,
            poolAddress: req.assetPool.address,
            type: w.type,
            amount: w.amount,
            beneficiary: w.beneficiary,
            unlockDate: w.unlockDate,
            state: w.state,
            rewardId: w.rewardId,
            transactions: w.transactions,
            createdAt: w.createdAt,
        };

        return res.json(response);
    }

    if (req.assetPool.variant === 'nftPool') {
        let metadata = await ERC721Service.findMetadataById(reward.erc721metadataId);
        const erc721 = await ERC721Service.findById(metadata.erc721);

        metadata = await ERC721Service.mint(req.assetPool, erc721, metadata, account.address);

        agenda.now(eventNameRequireTransactions, {});

        return res.json(metadata);
    }
}
