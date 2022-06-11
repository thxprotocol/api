import { PaymentState } from '@/types/enums/PaymentState';
import { Payment, PaymentDocument } from '@/models/Payment';
import { WALLET_URL } from '@/config/secrets';
import { assertEvent, CustomEventLog } from '@/util/events';
import { TransactionDocument } from '@/models/Transaction';
import TransactionService from './TransactionService';
import { TAssetPool } from '@/types/TAssetPool';
import { createRandomToken } from '@/util/token';
import ERC20Service from '@/services/ERC20Service';
import { AssetPoolDocument } from '@/models/AssetPool';

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
        state: PaymentState.Pending,
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

async function pay(pool: TAssetPool, payment: PaymentDocument, callData: { call: string; nonce: number; sig: string }) {
    const callback = async (tx: TransactionDocument, events?: CustomEventLog[]): Promise<PaymentDocument> => {
        if (events) {
            assertEvent('Topup', events);
            payment.state = PaymentState.Completed;
        }

        payment.transactions.push(String(tx._id));

        return await payment.save();
    };

    return await TransactionService.relay(
        pool.contract,
        'call',
        [callData.call, callData.nonce, callData.sig],
        pool.network,
        callback,
    );
}

function getPaymentUrl(id: string, token: string) {
    return `${WALLET_URL}/payment/${String(id)}?accessToken=${token}`;
}

export default { create, pay, get, getPaymentUrl, findByPool };
