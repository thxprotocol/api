import { Request, Response } from 'express';
import { body } from 'express-validator';
import PaymentService from '@/services/PaymentService';
import { TPayment } from '@/models/Payment';
import ERC20Service from '@/services/ERC20Service';
import { npToChainId } from '@/config/contracts';
export const createPaymentValidation = [body('amount').isNumeric()];

export default async function createPayment(req: Request, res: Response) {
    const token = await ERC20Service.findByPool(req.assetPool);

    const p = await PaymentService.create(
        req.assetPool.address,
        token.address,
        req.assetPool.network,
        npToChainId(req.assetPool.network),
        req.body.amount,
    );

    const result: TPayment = {
        id: String(p._id),
        sender: p.sender,
        receiver: p.receiver,
        amount: p.amount,
        token: p.token,
        chainId: p.chainId,
        network: p.network,
        state: p.state,
        createdAt: p.createdAt,
        redirectUrl: p.redirectUrl,
    };

    res.json(result);
}
