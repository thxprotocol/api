import { Request, Response } from 'express';
import { param } from 'express-validator';
import { NotFoundError, UnauthorizedError } from '@/util/errors';
import PaymentService from '@/services/PaymentService';
import ERC20Service from '@/services/ERC20Service';

const validation = [param('id').isMongoId()];

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['Payments']
    const payment = await PaymentService.get(req.params.id);
    if (!payment) throw new NotFoundError();
    if (payment.token !== req.header('X-Payment-Token')) throw new UnauthorizedError('Payment Token is incorrect');

    const erc20 = await ERC20Service.findBy({ address: payment.tokenAddress, chainId: payment.chainId });

    res.json({ ...payment.toJSON(), tokenSymbol: erc20.symbol });
};

export default { validation, controller };
