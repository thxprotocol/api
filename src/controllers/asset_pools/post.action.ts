import { Response, NextFunction } from 'express';
import { HttpError, HttpRequest } from '../../models/Error';
import AssetPoolService from '../../services/AssetPoolService';
import AccountService from '../../services/AccountService';

export const postAssetPool = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        const { assetPool, error } = await AssetPoolService.deploy(req.user.sub, req.body.network);

        if (error) throw new Error(error);

        try {
            const { error } = await AssetPoolService.init(assetPool);

            if (error) throw new Error(error);

            try {
                const { error } = await AssetPoolService.addPoolToken(assetPool, req.body.token);

                if (error) throw new Error(error);

                try {
                    const { account } = await AccountService.get(req.user.sub);
                    const { error } = await AccountService.addMembershipForAddress(assetPool, account.address);

                    if (error) throw new Error(error);

                    try {
                        const { rat, error } = await AccountService.addRatForAddress(account.address);

                        if (error) throw new Error(error);

                        assetPool.rat = rat;

                        await assetPool.save();

                        res.status(201).json({ address: assetPool.solution.options.address });
                    } catch (error) {
                        return next(new HttpError(502, error.toString(), error));
                    }
                } catch (error) {
                    return next(new HttpError(502, error.toString(), error));
                }
            } catch (e) {
                return next(new HttpError(502, 'Could not store the asset pool and account data.', e));
            }
        } catch (e) {
            return next(new HttpError(502, 'Could not add a token to the asset pool.'));
        }
    } catch (e) {
        return next(new HttpError(502, 'Could not deploy the asset pool on the network.', e));
    }
};
