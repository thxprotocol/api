import { Request, Response } from 'express';
import WithdrawalService from '@/services/WithdrawalService';
import { ForbiddenError } from '@/util/errors';
import { param } from 'express-validator';

const validation = [param('id').isMongoId()];
const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['Withdrawals']
    const withdrawal = await WithdrawalService.getById(req.params.id);
    if (withdrawal.sub !== req.user.sub) throw new ForbiddenError('Forbidden to delete this withdrawal');
    await withdrawal.delete();
    res.status(204).end();
};

export default { controller, validation };
