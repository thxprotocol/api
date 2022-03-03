import newrelic from 'newrelic';
import { Request, Response } from 'express';
import { Withdrawal } from '@/models/Withdrawal';
import { agenda, eventNameProcessWithdrawals } from '@/util/agenda';
import { BadRequestError, NotFoundError } from '@/util/errors';

import MemberService from '@/services/MemberService';
import WithdrawalService from '@/services/WithdrawalService';

import AccountProxy from '@/proxies/AccountProxy';
import { WithdrawalState, WithdrawalType } from '@/types/enums';
import { TWithdrawal } from '@/types/Withdrawal';

export const postWithdrawal = async (req: Request, res: Response) => {
    const account = await AccountProxy.getByAddress(req.body.member);
    if (!account) throw new NotFoundError('Account not found');

    const isMember = await MemberService.isMember(req.assetPool, req.body.member);
    if (!isMember) throw new BadRequestError('Address is not a member of asset pool.');

    const withdrawal = await WithdrawalService.schedule(
        req.assetPool,
        WithdrawalType.ProposeWithdraw,
        account.id,
        req.body.amount,
        // Accounts with stored (encrypted) privateKeys are custodial and should not be processed before
        // they have logged into their wallet to update their account with a new wallet address.
        account.privateKey ? WithdrawalState.Deferred : WithdrawalState.Pending,
    );

    agenda.now(eventNameProcessWithdrawals, null);

    Withdrawal.countDocuments({}, (_err: any, count: number) => newrelic.recordMetric('/Withdrawal/TotalCount', count));
    Withdrawal.countDocuments({ state: WithdrawalState.Deferred }, (_err: any, count: number) =>
        newrelic.recordMetric('/Withdrawal/DeferredCount', count),
    );

    const result: TWithdrawal = {
        id: withdrawal.id,
        sub: account.id,
        poolAddress: req.assetPool.address,
        type: withdrawal.type,
        withdrawalId: withdrawal.withdrawalId,
        rewardId: withdrawal.rewardId,
        beneficiary: withdrawal.beneficiary,
        amount: withdrawal.amount,
        approved: withdrawal.approved,
        state: withdrawal.state,
        poll: withdrawal.poll,
        createdAt: withdrawal.createdAt,
        updatedAt: withdrawal.updatedAt,
    };

    res.status(201).json(result);
};

/**
 * @swagger
 * /withdrawals:
 *   post:
 *     tags:
 *       - Withdrawals
 *     description: Proposes a custom withdrawal for a member of the pool
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: assetPool
 *         in: header
 *         required: true
 *         type: string
 *       - name: member
 *         in: body
 *         required: true
 *         type: string
 *       - name: amount
 *         in: body
 *         required: true
 *         type: number
 *     responses:
 *       '201':
 *         description: OK
 *         content: application/json
 *         schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   description: ID of the withdraw poll
 *       '400':
 *         $ref: '#/components/responses/400'
 *       '401':
 *         $ref: '#/components/responses/401'
 *       '403':
 *         description: Forbidden. Your account does not have access to this pool.
 *       '500':
 *         $ref: '#/components/responses/500'
 *       '502':
 *         $ref: '#/components/responses/502'
 */
