import { Request, Response } from 'express';
import WithdrawalService from '@/services/WithdrawalService';
import { ForbiddenError } from '@/util/errors';

export async function DeleteWithdrawalController(req: Request, res: Response) {
    const withdrawal = await WithdrawalService.getById(req.params.id);
    if (withdrawal.sub !== req.user.sub) throw new ForbiddenError('Forbidden to delete this withdrawal');
    await withdrawal.delete();
    res.status(204).end();
}
