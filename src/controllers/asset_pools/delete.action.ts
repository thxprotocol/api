import { Response, NextFunction } from 'express';
import { HttpRequest, HttpError } from '../../models/Error';
import RewardService from '../../services/RewardService';
import WithdrawalService from '../../services/WithdrawalService';
import ClientService from '../../services/ClientService';
import AssetPoolService from '../../services/AssetPoolService';

const ERROR_REMOVE_REWARDS = 'Could not remove rewards.';
const ERROR_REMOVE_WITHDRAWALS = 'Could not remove withdrawals.';
const ERROR_REMOVE_CLIENT = 'Could not remove client.';
const ERROR_REMOVE_ASSETPOOL = 'Could not remove asset pool.';

export async function deleteAssetPool(req: HttpRequest, res: Response, next: NextFunction) {
    async function removeAssetPool(address: string) {
        const { error } = await AssetPoolService.removeByAddress(address);
        if (error) {
            return next(new HttpError(502, ERROR_REMOVE_ASSETPOOL, new Error(error)));
        }
    }

    async function removeClient(clientId: string) {
        const { error } = await ClientService.remove(clientId);
        if (error) {
            return next(new HttpError(502, ERROR_REMOVE_CLIENT, new Error(error)));
        }
    }

    async function removeWithdrawals(address: string) {
        const { error } = await WithdrawalService.removeAllForAddress(address);
        if (error) {
            return next(new HttpError(502, ERROR_REMOVE_WITHDRAWALS, new Error(error)));
        }
    }

    async function removeRewards(address: string) {
        const { error } = await RewardService.removeAllForAddress(address);
        if (error) {
            return next(new HttpError(502, ERROR_REMOVE_REWARDS, new Error(error)));
        }
    }

    try {
        await removeRewards(req.solution.options.address);
        await removeWithdrawals(req.solution.options.address);
        await removeClient(req.assetPool.clientId);
        await removeAssetPool(req.solution.options.address);

        res.status(204).end();
    } catch (error) {
        return next(new HttpError(502, error.message, error));
    }
}
