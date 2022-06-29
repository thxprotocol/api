import { Request, Response } from 'express';
import { query } from 'express-validator';
import WithdrawalService from '@/services/WithdrawalService';
import TransactionService from '@/services/TransactionService';

const validation = [
    query('page').exists().isNumeric(),
    query('limit').exists().isNumeric(),
    query('member').optional().isEthereumAddress(),
    query('rewardId').optional().isNumeric(),
    query('state').optional().isNumeric(),
];

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['Withdrawals']
    const withdrawals = [];
    const result = await WithdrawalService.getAll(
        String(req.assetPool._id),
        Number(req.query.page),
        Number(req.query.limit),
        req.query.member && req.query.member.length > 0 ? String(req.query.member) : undefined,
        !isNaN(Number(req.query.rewardId)) ? Number(req.query.rewardId) : undefined,
        !isNaN(Number(req.query.state)) ? Number(req.query.state) : undefined,
    );

    for (const w of result.results) {
        const transactions = await Promise.all(
            w.transactions.map(async (id: string) => {
                return await TransactionService.getById(id);
            }),
        );
        withdrawals.push({ ...w.toJSON(), transactions });
    }
    result.results = withdrawals;
    res.json(result);
};

export default { controller, validation };
