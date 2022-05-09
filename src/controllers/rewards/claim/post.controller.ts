import { Request, Response } from 'express';
import { param } from 'express-validator';
import { BadRequestError, ForbiddenError } from '@/util/errors';
import { WithdrawalState, WithdrawalType } from '@/types/enums';
import { TWithdrawal } from '@/types/TWithdrawal';
import { WithdrawalDocument } from '@/models/Withdrawal';
import { agenda, eventNameRequireTransactions } from '@/util/agenda';
import AccountProxy from '@/proxies/AccountProxy';
import RewardService from '@/services/RewardService';
import MemberService from '@/services/MemberService';
import WithdrawalService from '@/services/WithdrawalService';
import MembershipService from '@/services/MembershipService';
import ERC721Service from '@/services/ERC721Service';

const validation = [param('id').exists().isNumeric()];

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['Rewards']
    if (!req.user.sub) throw new BadRequestError('No subscription is found for this type of access token.');

    const rewardId = Number(req.params.id);
    const reward = await RewardService.get(req.assetPool, rewardId);
    if (!reward) throw new BadRequestError('The reward for this ID does not exist.');

    const account = await AccountProxy.getById(req.user.sub);
    if (!account.address)
        throw new BadRequestError('The authenticated account has not wallet address. Sign in the Web Wallet once.');

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
};

export default { controller, validation };
