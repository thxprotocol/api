import { Response, NextFunction } from 'express';
import { HttpRequest, HttpError } from '../../models/Error';
import { AssetPool } from '../../models/AssetPool';
import { Withdrawal } from '../../models/Withdrawal';
import { Reward } from '../../models/Reward';
import { Account } from '../../models/Account';
import { eventIndexer } from '../../util/indexer';
import { Client } from '../../models/Client';
import { Rat, RatDocument } from '../../models/Rat';

export const deleteAssetPool = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        // Remove rewards for given address
        const rewards = await Reward.find({ poolAddress: req.solution.options.address });
        for (const r of rewards) {
            await r.remove();
        }

        // Remove withdrawals for given address
        const withdrawals = await Withdrawal.find({ poolAddress: req.solution.options.address });
        for (const w of withdrawals) {
            await w.remove();
        }

        // Remove client and rat
        const rat: RatDocument = await Rat.findById(req.assetPool.rat);
        const client = Client.findById(rat.payload.clientId);

        await client.remove();
        await rat.remove();

        // Remove asset pool for given address
        const assetPool = await AssetPool.findOne({ address: req.solution.options.address });
        await assetPool.remove();

        // Remove rat and
        const account = await Account.findById(req.user.sub);

        const membershipIndex = account.memberships.indexOf(req.solution.options.address);
        account.memberships.splice(membershipIndex, 1);

        const ratIndex = account.registrationAccessTokens.indexOf(req.assetPool.rat);
        account.registrationAccessTokens.splice(ratIndex, 1);

        await account.save();

        eventIndexer.removeListener(req.assetPool.network, req.solution.options.address);

        // Notify users that asset pool has been removed
        res.status(204).end();
    } catch (e) {
        return next(new HttpError(502, 'Could not access all resources required for removal.', e));
    }
};
