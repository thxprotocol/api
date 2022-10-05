import { Request, Response } from 'express';
import { param } from 'express-validator';
import { NotFoundError, UnauthorizedError } from '@/util/errors';
import PaymentService from '@/services/PaymentService';
import ERC20Service from '@/services/ERC20Service';
import TransactionService from '@/services/TransactionService';
import { Promotion } from '@/models/Promotion';
import { ERC721Metadata } from '@/models/ERC721Metadata';
import { Membership } from '@/models/Membership';
import AccountProxy from '@/proxies/AccountProxy';

const validation = [param('id').exists().isString()];

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['Payments']
    const payment = await PaymentService.get(req.params.id);
    if (!payment) throw new NotFoundError();
    if (payment.token !== req.header('X-Payment-Token')) throw new UnauthorizedError('Payment Token is incorrect');

    const erc20 = await ERC20Service.findBy({ address: payment.tokenAddress, chainId: payment.chainId });
    const failReason = await TransactionService.findFailReason(payment.transactions);

    let metadata;
    if (payment.metadataId) {
        metadata = await ERC721Metadata.findById(payment.metadataId);
    }

    let promotion, membership;
    if (payment.promotionId) {
        promotion = await Promotion.findById(payment.promotionId);
        if (payment.sender) {
            const account = await AccountProxy.getByAddress(payment.sender);
            if (account) {
                membership = await Membership.findOne({ poolId: payment.poolId, sub: account.id });
            }
        }
    }

    res.json({ ...payment.toJSON(), metadata, promotion, membership, failReason, tokenSymbol: erc20.symbol });
};

export default { validation, controller };
