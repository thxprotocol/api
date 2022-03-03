import { Request, Response } from 'express';
import WithdrawalService from '@/services/WithdrawalService';
import { NotFoundError } from '@/util/errors';
import { TWithdrawal } from '@/types/Withdrawal';

export const postPollFinalize = async (req: Request, res: Response) => {
    const withdrawal = await WithdrawalService.getById(req.params.id);
    if (!withdrawal) throw new NotFoundError('Withdrawal not found');
    const w = await WithdrawalService.withdrawPollFinalize(req.assetPool, withdrawal);
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
        approved: w.approved,
        state: w.state,
        poll: w.poll,
        createdAt: w.createdAt,
        updatedAt: w.updatedAt,
    };

    res.json(result);
};
