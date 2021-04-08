import { Response, NextFunction } from 'express';
import { Rat } from '../../models/Rat';
import { Client } from '../../models/Client';
import { Account } from '../../models/Account';
import { HttpRequest, HttpError } from '../../models/Error';
import { AssetPool } from '../../models/AssetPool';

export const deleteClient = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        try {
            const rat = await Rat.findById(req.params.rat);
            const client = await Client.findById(rat.payload.clientId);

            if (!client) {
                return next(new HttpError(404, 'Could not find client for this request_access_token.'));
            }

            const assetPools = await AssetPool.find({ aud: rat.payload.clientId });

            if (assetPools.length > 0) {
                return next(new HttpError(403, `Remove ${assetPools.length} asset pools using this client first.`));
            }

            try {
                const account = await Account.findById(req.user.sub);
                const index = account.registrationAccessTokens.indexOf(rat.payload.jti);

                account.registrationAccessTokens.splice(index, 1);

                await account.save();

                await rat.remove();
                await client.remove();

                res.status(204).end();
            } catch (e) {
                return next(new HttpError(502, 'Could not remove the client.', e));
            }
        } catch (e) {
            return next(new HttpError(502, 'Could not access all resources required for removal.', e));
        }
    } catch (e) {
        next(new HttpError(502, 'Could verify removal status for this client.', e));
    }
};
