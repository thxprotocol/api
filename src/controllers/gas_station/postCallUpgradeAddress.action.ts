import { Response, NextFunction } from 'express';
import { callFunction, sendTransaction } from '../../util/network';
import { Account } from '../../models/Account';
import { HttpError, HttpRequest } from '../../models/Error';
import { parseLogs, findEvent } from '../../util/events';
import { Artifacts } from '../../util/artifacts';
import { Withdrawal } from '../../models/Withdrawal';
import { Member } from '../../models/Member';

export const postCallUpgradeAddress = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        const isMember = await callFunction(req.solution.methods.isMember(req.body.newAddress), req.assetPool.network);

        if (!isMember) {
            await sendTransaction(
                req.solution.options.address,
                req.solution.methods.addMember(req.body.newAddress),
                req.assetPool.network,
            );
        }

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

                    try {
                        const withdrawals = await Withdrawal.find({ beneficiary: event.args.previousAddress });

                        for (const withdrawal of withdrawals) {
                            withdrawal.beneficiary = event.args.newAddress;

                            await withdrawal.save();
                        }

                        const member = await Member.findOne({ address: event.args.previousAddress });

                        member.address = event.args.newAddress;

                        await member.save();

                        return res.status(200).end();
                    } catch (e) {
                        return next(new HttpError(502, 'Could not migrate the withdrawals in db.', e));
                    }
                } catch (e) {
                    return next(new HttpError(502, 'Could not store the new address for the account.', e));
                }
            } else {
                return next(new HttpError(502, 'No event in the result after sending calldata.'));
            }
        } catch (e) {
            return next(new HttpError(502, 'Could not change the address for the member.', e));
        }
    } catch (e) {
        return next(new HttpError(502, 'Could not add the new address as a member.', e));
    }
};
