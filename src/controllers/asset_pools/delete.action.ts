import { Response, NextFunction } from 'express';
import { HttpRequest, HttpError } from '../../models/Error';
import RewardService from '../../services/RewardService';
import WithdrawalService from '../../services/WithdrawalService';
import RatService from '../../services/RatService';
import ClientService from '../../services/ClientService';
import AssetPoolService from '../../services/AssetPoolService';
import AccountService from '../../services/AccountService';
import { IAssetPool } from '../../models/AssetPool';

export async function deleteAssetPool(req: HttpRequest, res: Response, next: NextFunction) {
    async function removeAssetPool(address: string) {
        const { error } = await AssetPoolService.removeByAddress(address);
        if (error) {
            return next(new HttpError(502, 'Could not remove asset pool.', new Error(error)));
        }
    }

    async function removeRat(rat: string) {
        const { error } = await RatService.remove(rat);
        if (error) {
            return next(new HttpError(502, 'Could not remove registration access token.', new Error(error)));
        }
    }

    async function removeClient(clientId: string) {
        const { error } = await ClientService.remove(clientId);
        if (error) {
            return next(new HttpError(502, 'Could not remove client.', new Error(error)));
        }
    }

    async function getRat(_rat: string) {
        const { rat, error } = await RatService.get(_rat);
        if (error) {
            return next(new HttpError(502, 'Could not find registration access token.', new Error(error)));
        }
        return rat;
    }

    async function removeWithdrawals(address: string) {
        const { error } = await WithdrawalService.removeAllForAddress(address);
        if (error) {
            return next(new HttpError(502, 'Could not remove withdrawals.', new Error(error)));
        }
    }

    async function removeRewards(address: string) {
        const { error } = await RewardService.removeAllForAddress(address);
        if (error) {
            return next(new HttpError(502, 'Could not remove rewards.', new Error(error)));
        }
    }

    async function removeMembership(assetPool: IAssetPool) {
        const { account } = await AccountService.get(assetPool.sub);
        const { error } = await AccountService.removeMembershipForAddress(assetPool, account.address);

        if (error) {
            return next(new HttpError(502, 'Could not remove rewards.', new Error(error)));
        }
    }

    try {
        await removeRewards(req.solution.options.address);
        await removeWithdrawals(req.solution.options.address);

        const rat = await getRat(req.assetPool.rat);

        if (rat) {
            await removeClient(rat.payload.clientId);
        }

        await removeRat(req.assetPool.rat);
        await removeAssetPool(req.solution.options.address);
        await removeMembership(req.assetPool);

        res.status(204).end();
    } catch (e) {
        return next(new HttpError(502, 'Could not remove membership.', e));
    }
}
