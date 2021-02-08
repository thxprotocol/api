import { Response, NextFunction } from 'express';
import { Account } from '../../models/Account';
import { HttpError, HttpRequest } from '../../models/Error';

export const postCallUpgradeAddress = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        const tx = await (await req.solution.call(req.body.call, req.body.nonce, req.body.sig)).wait();

        try {
            const account = await Account.findOne({ address: req.body.oldAddress });

            account.address = req.body.newAddress;
            account.privateKey = '';

            await account.save();
            res.json({ tx });
        } catch (err) {
            next(new HttpError(502, 'GasStation UpgradeAddress failed.', err));
        }
    } catch (err) {
        next(new HttpError(502, 'GasStation UpgradeAddress failed.', err));
    }
};
