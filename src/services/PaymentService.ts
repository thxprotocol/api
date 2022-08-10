import { PaymentState } from '@/types/enums/PaymentState';
import { Payment, PaymentDocument } from '@/models/Payment';
import { WALLET_URL } from '@/config/secrets';
import { assertEvent, CustomEventLog } from '@/util/events';
import { TransactionDocument } from '@/models/Transaction';
import TransactionService from './TransactionService';
import { createRandomToken } from '@/util/token';
import ERC20Service from '@/services/ERC20Service';
import { AssetPoolDocument } from '@/models/AssetPool';
import { Contract } from 'web3-eth-contract';

async function create(
    pool: AssetPoolDocument,
    chainId: string,
    {
        amount,
        successUrl,
        failUrl,
        cancelUrl,
    }: { amount: string; successUrl: string; failUrl: string; cancelUrl: string },
) {
    const token = createRandomToken();
    const address = await pool.contract.methods.getERC20().call();
    const erc20 = await ERC20Service.findOrImport(pool, address);

    return await Payment.create({
        poolId: pool._id,
        chainId,
        state: PaymentState.Requested,
        token,
        amount,
        receiver: pool.address,
        tokenAddress: erc20.address,
        successUrl,
        failUrl,
        cancelUrl,
    });
}

async function get(id: string) {
    return Payment.findById(id);
}

async function findByPool(pool: AssetPoolDocument) {
    return Payment.find({
        poolId: String(pool._id),
    });
}

async function pay(contract: Contract, payment: PaymentDocument) {
    payment.state = PaymentState.Pending;
    await payment.save();

    return await TransactionService.relay(
        contract,
        'transferFrom',
        [payment.sender, payment.receiver, payment.amount],
        payment.chainId,
        async (tx: TransactionDocument, events?: CustomEventLog[]): Promise<PaymentDocument> => {
            if (events) {
                assertEvent('Transfer', events);
                payment.state = PaymentState.Completed;
            }
            payment.transactions.push(String(tx._id));

            return await payment.save();
        },
    );
}

function getPaymentUrl(id: string, token: string) {
    return `${WALLET_URL}/payment/${String(id)}?accessToken=${token}`;
}

export default { create, pay, get, getPaymentUrl, findByPool };
