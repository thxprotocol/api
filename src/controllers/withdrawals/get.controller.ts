import { Request, Response } from 'express';
import WithdrawalService from '@/services/WithdrawalService';
import { NotFoundError } from '@/util/errors';
import { TWithdrawal } from '@/types/TWithdrawal';

export const getWithdrawal = async (req: Request, res: Response) => {
    // #swagger.tags = ['Withdrawals']
    const withdrawal = await WithdrawalService.getById(req.params.id);
    if (!withdrawal) throw new NotFoundError();

    const result: TWithdrawal = {
        id: String(withdrawal._id),
        type: withdrawal.type,
        sub: withdrawal.sub,
        beneficiary: withdrawal.beneficiary,
        unlockDate: withdrawal.unlockDate,
        poolAddress: req.assetPool.address,
        withdrawalId: withdrawal.withdrawalId,
        state: withdrawal.state,
        failReason: withdrawal.failReason,
        amount: withdrawal.amount,
        transactions: withdrawal.transactions,
        createdAt: withdrawal.createdAt,
    };

    res.json(result);
};
