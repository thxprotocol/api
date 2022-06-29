import { Request, Response } from 'express';
import { WithdrawalState, WithdrawalType } from '@/types/enums';
import { BadRequestError, ForbiddenError, NotFoundError } from '@/util/errors';
import { TWithdrawal } from '@/types/TWithdrawal';
import AccountProxy from '@/proxies/AccountProxy';
import RewardService from '@/services/RewardService';
import WithdrawalService from '@/services/WithdrawalService';
import MemberService from '@/services/MemberService';
import { WithdrawalDocument } from '@/models/Withdrawal';
import { agenda, EVENT_REQUIRE_TRANSACTIONS } from '@/util/agenda';
import { param, body } from 'express-validator';

const validation = [param('id').exists(), body('member').exists()];

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['Rewards']
    const rewardId = Number(req.params.id);
    const reward = await RewardService.get(req.assetPool, rewardId);
    if (!reward) throw new BadRequestError('Could not find a reward for this id');

    const isMember = await MemberService.isMember(req.assetPool, req.body.member);
    if (!isMember && reward.isMembershipRequired) throw new ForbiddenError();

    const account = await AccountProxy.getByAddress(req.body.member);
    if (!account) throw new NotFoundError();

    let w: WithdrawalDocument = await WithdrawalService.schedule(
        req.assetPool,
        WithdrawalType.ClaimRewardFor,
        account.id,
        reward.withdrawAmount,
        // Accounts with stored (encrypted) privateKeys are custodial and should not be processed before
        // they have logged into their wallet to update their account with a new wallet address.
        account.privateKey ? WithdrawalState.Deferred : WithdrawalState.Pending,
        reward.withdrawUnlockDate,
        rewardId,
    );

    w = await WithdrawalService.proposeWithdraw(req.assetPool, w, account);

    agenda.now(EVENT_REQUIRE_TRANSACTIONS, {});

    res.json({
        ...w.toJSON(),
        id: String(w._id),
        sub: account.id,
        poolAddress: req.assetPool.address,
    });
};

export default { controller, validation };
