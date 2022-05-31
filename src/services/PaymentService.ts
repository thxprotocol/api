import { PaymentState } from '@/types/enums/PaymentState';
import { Payment, PaymentDocument } from '@/models/Payment';
import { WALLET_URL } from '@/config/secrets';
import { assertEvent, CustomEventLog } from '@/util/events';
import { TransactionDocument } from '@/models/Transaction';
import TransactionService from './TransactionService';
import { TAssetPool } from '@/types/TAssetPool';

async function create(
    receiver: string,
    token: string,
    network: number,
    chainId: string,
    amount: string,
    returnUrl: string,
) {
    return await Payment.create({
        receiver,
        amount,
        network,
        chainId,
        token,
        state: PaymentState.Pending,
        returnUrl,
    });
}

async function get(id: string) {
    return Payment.findById(id);
}

async function pay(pool: TAssetPool, payment: PaymentDocument, callData: { call: string; nonce: number; sig: string }) {
    const callback = async (tx: TransactionDocument, events?: CustomEventLog[]): Promise<PaymentDocument> => {
        if (events) {
            assertEvent('Depositted', events);
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

function getPaymentUrl(id: string) {
    return `${WALLET_URL}/payments/${String(id)}`;
}

export default { create, pay, get, getPaymentUrl };
