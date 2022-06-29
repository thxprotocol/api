import { Request, Response } from 'express';
import { param } from 'express-validator';
import { ForbiddenError, NotFoundError } from '@/util/errors';
import { agenda, EVENT_REQUIRE_TRANSACTIONS } from '@/util/agenda';
import WithdrawalService from '@/services/WithdrawalService';

const validation = [param('id').isMongoId()];

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['Withdrawals']
    const withdrawal = await WithdrawalService.getById(req.params.id);
    if (!withdrawal) throw new NotFoundError('Withdrawal not found');

    // Can not withdraw if reward has an unlockDate and the Now is not greather than unlockDate
    // (included pending withdrawars)
    if (withdrawal.unlockDate && Date.now() < withdrawal.unlockDate.getTime()) {
        throw new ForbiddenError('This withdrawal is locked.');
    }

    const w = await WithdrawalService.withdraw(req.assetPool, withdrawal);

    agenda.now(EVENT_REQUIRE_TRANSACTIONS, {});

    res.json({
        ...w.toJSON(),
        sub: w.sub,
        poolAddress: req.assetPool.address,
    });
};

export default { controller, validation };
