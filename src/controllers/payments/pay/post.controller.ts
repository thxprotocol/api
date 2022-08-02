import { Request, Response } from 'express';
import { body, param } from 'express-validator';
import {
    AmountExceedsAllowanceError,
    ForbiddenError,
    InsufficientBalanceError,
    NotFoundError,
    UnauthorizedError,
} from '@/util/errors';
import { getContractFromName } from '@/config/contracts';
import ERC20Service from '@/services/ERC20Service';
import PaymentService from '@/services/PaymentService';
import { recoverAddress } from '@/util/network';
import { PaymentState } from '@/types/enums/PaymentState';

const validation = [
    param('id').isMongoId(),
    body('call').isString().exists(),
    body('nonce').isNumeric().exists(),
    body('sig').isString().exists(),
    body('isMetamaskAccount').isBoolean().optional(),
];

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['Payments']
    let payment = await PaymentService.get(req.params.id);

    if (!payment) {
        throw new NotFoundError();
    }
    if (payment.token !== req.header('X-Payment-Token')) {
        throw new UnauthorizedError('Payment access token is incorrect');
    }
    if (payment.state === PaymentState.Pending) {
        throw new ForbiddenError('Payment state is pending');
    }
    if (payment.state === PaymentState.Completed) {
        throw new ForbiddenError('Payment state is completed');
    }

    const { call, nonce, sig } = req.body;
    const erc20 = await ERC20Service.findByPool(req.assetPool);
    const contract = getContractFromName(req.assetPool.chainId, 'LimitedSupplyToken', erc20.address);

    payment.sender = recoverAddress(call, nonce, sig, req.body.isMetamaskAccount);
    await payment.save();

    // Check balance to ensure throughput
    const balance = await contract.methods.balanceOf(payment.sender).call();
    if (Number(balance) < Number(payment.amount)) throw new InsufficientBalanceError();

    // Check allowance to ensure throughput
    const allowance = Number(await contract.methods.allowance(payment.sender, req.assetPool.address).call());
    if (Number(allowance) < Number(payment.amount)) throw new AmountExceedsAllowanceError();

    payment = await PaymentService.pay(req.assetPool, payment, { call, nonce, sig });

    res.json(payment);
};

export default {
    validation,
    controller,
};
