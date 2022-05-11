import { PaymentState } from '@/types/enums/PaymentState';

import { Payment } from '@/models/Payment';

async function create(receiver: string, token: string, network: number, chainId: string, amount: string) {
    return await Payment.create({
        receiver,
        amount,
        network,
        chainId,
        token,
        state: PaymentState.Pending,
    });
}

async function get(id: string) {
    return Payment.findById(id);
}

// async function transact(assetPool: AssetPoolType, deposit: DepositDocument, call: string, nonce: number, sig: string) {
//     if (ITX_ACTIVE) {
//         const tx = await InfuraService.schedule(assetPool.address, 'call', [call, nonce, sig], assetPool.network);
//         deposit.transactions.push(String(tx._id));

//         return await deposit.save();
//     } else {
//         try {
//             const { tx, receipt } = await TransactionService.send(
//                 assetPool.address,
//                 assetPool.contract.methods.call(call, nonce, sig),
//                 assetPool.network,
//                 500000,
//             );

//             const events = parseLogs(assetPool.contract.options.jsonInterface, receipt.logs);
//             const result = findEvent('Result', events);

//             if (!result.args.success) {
//                 const error = hex2a(result.args.data.substr(10));
//                 throw new InternalServerError(error);
//             }

//             assertEvent('Depositted', events);

//             deposit.transactions.push(String(tx._id));
//             deposit.state = DepositState.Completed;

//             return await deposit.save();
//         } catch (error) {
//             deposit.failReason = error.message;
//             throw error;
//         }
//     }
// }

export default { create, get };
