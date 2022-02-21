import { Request, Response } from 'express';
import { body } from 'express-validator';

import AccountProxy from '@/proxies/AccountProxy';
import DepositService from '@/services/DepositService';
import PromoCodeService from '@/services/PromoCodeService';
import { agenda, eventNameRequireDeposits } from '@/util/agenda';

export const createDepositValidation = [body('item').isString().isLength({ min: 24, max: 24 })];

export default async function CreateDepositController(req: Request, res: Response) {
    const promoCode = await PromoCodeService.findById(req.body.item);
    const account = await AccountProxy.getById(req.user.sub);
    const { _id, sender, receiver, amount, state } = await DepositService.create(
        req.assetPool,
        account,
        promoCode.price,
        req.body.item,
    );

    // Check if a deposit is made for
    // This checks for Transfers but a Deposit event should actually be added
    // to the Token facet
    agenda.now(eventNameRequireDeposits, { from: sender, to: receiver, value: amount });
    // account.address
    // assetPool.address
    // promoCode.price

    res.json({ id: String(_id), sender, receiver, amount, state });
}
