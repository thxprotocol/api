import { Request, Response } from 'express';
import { param } from 'express-validator';
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
import { PaymentState } from '@/types/enums/PaymentState';
import AccountProxy from '@/proxies/AccountProxy';
import { getProvider } from '@/util/network';
import MemberService from '@/services/MemberService';
import AssetPoolService from '@/services/AssetPoolService';

const validation = [param('id').exists().isString()];

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

    const { defaultAccount } = getProvider(payment.chainId);
    const erc20 = await ERC20Service.findByPool(req.assetPool);
    const contractName = 'LimitedSupplyToken';
    const contract = getContractFromName(req.assetPool.chainId, contractName, erc20.address);

    // Recover signer from message
    const account = await AccountProxy.getById(req.auth.sub);
    payment.sender = account.address;

    if (payment.promotionId) {
        const assetPool = await AssetPoolService.getById(payment.poolId);
        if (!MemberService.isMember(assetPool, account.address)) {
            throw new ForbiddenError('Account is not a member of the pool');
        }
    }

    // Check balance to ensure throughput
    const balance = await contract.methods.balanceOf(payment.sender).call();
    if (Number(balance) < Number(payment.amount)) throw new InsufficientBalanceError();

    // Check allowance to ensure throughput
    const allowance = Number(await contract.methods.allowance(payment.sender, defaultAccount).call());
    if (Number(allowance) < Number(payment.amount)) throw new AmountExceedsAllowanceError();

    payment = await PaymentService.pay(contract, payment, contractName);
    res.json(await payment.save());
};

export default {
    validation,
    controller,
};
