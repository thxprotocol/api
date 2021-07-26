import { Response, NextFunction } from 'express';
import { sendTransaction } from '@/util/network';
import { Account } from '@/models/Account';
import { HttpError, HttpRequest } from '@/models/Error';
import { parseLogs, findEvent } from '@/util/events';
import { Artifacts } from '@/util/artifacts';

export const postCallUpgradeAddress = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        const tx = await sendTransaction(
            req.solution.options.address,
            req.solution.methods.call(req.body.call, req.body.nonce, req.body.sig),
            req.assetPool.network,
        );
        const events = parseLogs(Artifacts.IDefaultDiamond.abi, tx.logs);
        const event = findEvent('MemberAddressChanged', events);

        if (event) {
            try {
                const account = await Account.findOne({ address: event.args.previousAddress });

                account.address = event.args.newAddress;
                account.privateKey = '';

                await account.save();

                return res.status(200).end();
            } catch (err) {
                return next(new HttpError(502, 'Could not store the new address for the account.', err));
            }
        }
    } catch (err) {
        return next(new HttpError(502, 'Could not change the address for the member.', err));
    }
};
