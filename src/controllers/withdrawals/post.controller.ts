import newrelic from 'newrelic';
import { body } from 'express-validator';
import { Request, Response } from 'express';
import { Withdrawal, WithdrawalDocument } from '@/models/Withdrawal';
import { BadRequestError, NotFoundError } from '@/util/errors';
import { WithdrawalState, WithdrawalType } from '@/types/enums';
import { TWithdrawal } from '@/types/TWithdrawal';
import MemberService from '@/services/MemberService';
import WithdrawalService from '@/services/WithdrawalService';
import AccountProxy from '@/proxies/AccountProxy';

const validation = [body('member').isEthereumAddress(), , body('amount').exists().isNumeric()];

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['Withdrawals']
    const account = await AccountProxy.getByAddress(req.body.member);
    if (!account) throw new NotFoundError('Account not found');

    const isMember = await MemberService.isMember(req.assetPool, req.body.member);
    if (!isMember) throw new BadRequestError('Address is not a member of asset pool.');

    let withdrawUnlockDate = req.body.withdrawUnlockDate;
    if (!withdrawUnlockDate) {
        const now = new Date();
        withdrawUnlockDate = `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()}`;
    }

    let withdrawal: WithdrawalDocument = await WithdrawalService.schedule(
        req.assetPool,
        WithdrawalType.ProposeWithdraw,
        account.id,
        req.body.amount,
        // Accounts with stored (encrypted) privateKeys are custodial and should not be processed before
        // they have logged into their wallet to update their account with a new wallet address.
        account.privateKey ? WithdrawalState.Deferred : WithdrawalState.Pending,
        withdrawUnlockDate,
    );

    withdrawal = await WithdrawalService.proposeWithdraw(req.assetPool, withdrawal, account);

    Withdrawal.countDocuments({}, (_err: any, count: number) => newrelic.recordMetric('/Withdrawal/TotalCount', count));
    Withdrawal.countDocuments({ state: WithdrawalState.Deferred }, (_err: any, count: number) =>
        newrelic.recordMetric('/Withdrawal/DeferredCount', count),
    );

    res.status(201).json({
        ...withdrawal.toJSON(),
        sub: account.id,
        poolAddress: req.assetPool.address,
    });
};
export default { controller, validation };
