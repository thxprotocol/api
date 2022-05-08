import { Request, Response } from 'express';

import WithdrawalService from '@/services/WithdrawalService';

export const getWithdrawals = async (req: Request, res: Response) => {
    // #swagger.tags = ['Withdrawals']
    const withdrawals = [];
    const result = await WithdrawalService.getAll(
        req.assetPool.address,
        Number(req.query.page),
        Number(req.query.limit),
        req.query.member && req.query.member.length > 0 ? String(req.query.member) : undefined,
        !isNaN(Number(req.query.rewardId)) ? Number(req.query.rewardId) : undefined,
        !isNaN(Number(req.query.state)) ? Number(req.query.state) : undefined,
    );

    for (const w of result.results) {
        withdrawals.push({
            id: String(w._id),
            type: w.type,
            withdrawalId: w.withdrawalId,
            failReason: w.failReason,
            rewardId: w.rewardId,
            beneficiary: w.beneficiary,
            amount: w.amount,
            unlockDate: w.unlockDate,
            state: w.state,
            poll: w.poll,
            transactions: w.transactions,
            createdAt: w.createdAt,
            updatedAt: w.updatedAt,
        });
    }
    result.results = withdrawals;
    res.json(result);
};
