import { TAssetPool } from '@/types/TAssetPool';
import { Deposit, DepositDocument } from '@/models/Deposit';
import { IAccount } from '@/models/Account';
import { DepositState } from '@/types/enums/DepositState';
import TransactionService from './TransactionService';
import InfuraService from './InfuraService';
import { ITX_ACTIVE } from '@/config/secrets';
import { assertEvent, findEvent, hex2a, parseLogs } from '@/util/events';
import { InternalServerError } from '@/util/errors';
import { logger } from '@/util/logger'; 
import { toWei } from 'web3-utils';

async function get(assetPool: TAssetPool, depositId: number): Promise<DepositDocument> {
    const deposit = await Deposit.findOne({ poolAddress: assetPool.address, id: depositId });
    if (!deposit) return null;
    return deposit;
}

async function getAll(assetPool: TAssetPool): Promise<DepositDocument[]> {
    const deposit = await Deposit.find({ poolAddress: assetPool.address});
    return deposit;
}

async function schedule(assetPool: TAssetPool, account: IAccount, amount: number, item?: string) {
    return await Deposit.create({
        sub: account.id,
        sender: account.address,
        receiver: assetPool.address,
        amount,
        state: DepositState.Pending,
        item,
    });
}

async function create(assetPool: TAssetPool, deposit: DepositDocument, call: string, nonce: number, sig: string) {
    if (ITX_ACTIVE) {
        const tx = await InfuraService.schedule(assetPool.address, 'call', [call, nonce, sig], assetPool.network);
        deposit.transactions.push(String(tx._id));

        return await deposit.save();
    } else {
        try {
            const { tx, receipt } = await TransactionService.send(
                assetPool.address,
                assetPool.contract.methods.call(call, nonce, sig),
                assetPool.network,
                500000,
            );

            const events = parseLogs(assetPool.contract.options.jsonInterface, receipt.logs);
            const result = findEvent('Result', events);

            if (!result.args.success) {
                const error = hex2a(result.args.data.substr(10));
                logger.error(error);
                throw new InternalServerError(error);
            }

            assertEvent('Depositted', events);

            deposit.transactions.push(String(tx._id));
            deposit.state = DepositState.Completed;

            return await deposit.save();
        } catch (error) {
            logger.error(error);
            deposit.failReason = error.message;
            throw error;
        }
    }
}

async function depositForAdmin(assetPool: TAssetPool, deposit: DepositDocument) {
    const amountInWei = deposit.amount.toString()
    if (ITX_ACTIVE) {
        const tx = await InfuraService.schedule(
            assetPool.address,
            'deposit',
            [amountInWei],
            assetPool.network
        );

        deposit.transactions.push(String(tx._id));

        return await deposit.save();
    }
    try {
        const { tx, receipt } = await TransactionService.send(
            assetPool.address,
            assetPool.contract.methods.deposit(amountInWei),
            assetPool.network,
            500000,
        );

        const events = parseLogs(assetPool.contract.options.jsonInterface, receipt.logs);

        assertEvent('Depositted', events);

        deposit.transactions.push(String(tx._id));
        deposit.state = DepositState.Completed;

        return await deposit.save();
    } catch (error) {
        console.log('ERROR ON DEPOSIT FOR ADMIN', error.message)
        deposit.failReason = error.message;
        throw error;
    }
}
export default { get, getAll, create, schedule, depositForAdmin };


