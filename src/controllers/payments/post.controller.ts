import { Request, Response } from 'express';
import { body } from 'express-validator';
import PaymentService from '@/services/PaymentService';
import ERC20Service from '@/services/ERC20Service';
import { PaymentDocument } from '@/models/Payment';
import { npToChainId } from '@/config/contracts';

const validation = [body('amount').isNumeric(), body('chainId').optional().isNumeric()];

async function controller(req: Request, res: Response) {
    // #swagger.tags = ['Payments']
    const address = await req.assetPool.contract.methods.getERC20().call();
    const chainId = req.body.chainId || npToChainId(req.assetPool.network);
    const erc20 = await ERC20Service.findOrImport(req.assetPool, address);
    const payment: PaymentDocument = await PaymentService.create(
        req.assetPool.address,
        erc20.address,
        req.assetPool.network,
        chainId,
        req.body.amount,
        req.body.returnUrl,
    );
    const redirectUrl = PaymentService.getPaymentUrl(payment._id);

    res.status(201).json({ ...payment.toJSON(), redirectUrl });
}

export default { validation, controller };
