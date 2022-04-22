import { Request, Response } from 'express';
import WithdrawalService from '@/services/WithdrawalService';
import { NotFoundError } from '@/util/errors';
import { TWithdrawal } from '@/types/TWithdrawal';
import { agenda, eventNameRequireTransactions } from '@/util/agenda';

export const postPollFinalize = async (req: Request, res: Response) => {
    const withdrawal = await WithdrawalService.getById(req.params.id);
    if (!withdrawal) throw new NotFoundError('Withdrawal not found');

    // Can not withdraw if reward has an unlockDate and the Now is not greather than unlockDate
    // (included pending withdrawars)
    if (Date.now() < withdrawal.unlockDate.getTime()) {
        return { error: 'Not yet withdrawable' };
    }

    const w = await WithdrawalService.withdraw(req.assetPool, withdrawal);

    agenda.now(eventNameRequireTransactions, {});

    const result: TWithdrawal = {
        id: String(w._id),
        sub: w.sub,
        poolAddress: req.assetPool.address,
        type: w.type,
        withdrawalId: w.withdrawalId,
        failReason: w.failReason,
        rewardId: w.rewardId,
        beneficiary: w.beneficiary,
        amount: w.amount,
        unlockDate: w.unlockDate,
        state: w.state,
        transactions: w.transactions,
        createdAt: w.createdAt,
        updatedAt: w.updatedAt,
    };

    res.json(result);
};
