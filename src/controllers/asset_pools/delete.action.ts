import { Response, NextFunction } from 'express';
import { HttpRequest, HttpError } from '../../models/Error';
import { AssetPool } from '../../models/AssetPool';
import { Withdrawal } from '../../models/Withdrawal';
import { Reward } from '../../models/Reward';
import { Account } from '../../models/Account';

export const deleteAssetPool = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        // Remove rewards for given address
        const rewards = await Reward.find({ assetPool: req.solution.address });
        for (const r of rewards) {
            await r.remove();
        }

        // Remove withdrawals for given address
        const withdrawals = await Withdrawal.find({ assetPool: req.solution.address });
        for (const w of withdrawals) {
            await w.remove();
        }

        // Remove asset pool for given address
        const assetPool = await AssetPool.findOne({ address: req.solution.address });
        await assetPool.remove();

        const account = await Account.findById(req.user.sub);
        const index = account.memberships.indexOf(req.solution.address);

        account.memberships.splice(index, 1);

        await account.save();

        // Notify users that asset pool has been removed
        res.status(204).end();
    } catch (e) {
        return next(new HttpError(502, 'Could not access all resources required for removal.', e));
    }
};
