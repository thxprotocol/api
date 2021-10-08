import { Response, NextFunction } from 'express';
import { HttpRequest, HttpError } from '../../models/Error';
import RewardService from '../../services/RewardService';
import WithdrawalService from '../../services/WithdrawalService';
import RatService from '../../services/RatService';
import ClientService from '../../services/ClientService';
import AssetPoolService from '../../services/AssetPoolService';
import AccountService from '../../services/AccountService';

export const deleteAssetPool = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        // Remove rewards for given address
        const { error } = await RewardService.removeByAddress(req.solution.options.address);
        if (error) throw new Error(error);
        try {
            // Remove withdrawals for given address
            const { error } = await WithdrawalService.removeByAddress(req.solution.options.address);
            if (error) throw new Error(error);
            try {
                // get rat
                const { rat, error } = await RatService.get(req.assetPool.rat);
                if (error) throw new Error(error);
                try {
                    // remove client
                    const { error } = await ClientService.remove(rat.payload.clientId);
                    if (error) throw new Error(error);
                    try {
                        // remove rat
                        const { error } = await RatService.remove(req.assetPool.rat);
                        if (error) throw new Error(error);
                        try {
                            // Remove asset pool for given address
                            const { error } = await AssetPoolService.removeByAddress(
                                req.solution.options.address,
                            );
                            if (error) throw new Error(error);
                            try {
                                // Remove membership
                                const { error } = await AccountService.removeByAddress(
                                    req.assetPool,
                                    req.solution.options.address,
                                );
                                if (error) throw new Error(error);
                                // Notify users that asset pool has been removed
                                res.status(204).end();
                            } catch (e) {
                                return next(new HttpError(502, 'Could not remove membership.', e));
                            }
                        } catch (e) {
                            return next(new HttpError(502, 'Could not remove asset pool.', e));
                        }
                    } catch (e) {
                        return next(new HttpError(502, 'Could not remove rat.', e));
                    }
                } catch (e) {
                    return next(new HttpError(502, 'Could not remove client.', e));
                }
            } catch (e) {
                return next(new HttpError(502, 'Could not find rat.', e));
            }
        } catch (e) {
            return next(new HttpError(502, 'Could not remove withdrawal.', e));
        }
    } catch (e) {
        return next(new HttpError(502, 'Could not remove reward.', e));
    }
};
