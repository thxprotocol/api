import { TAssetPool } from '@/types/TAssetPool';
import { Deposit, DepositDocument } from '@/models/Deposit';
import { IAccount } from '@/models/Account';
import { DepositState } from '@/types/enums/DepositState';
import { ITX_ACTIVE } from '@/config/secrets';
import { assertEvent, findEvent, hex2a, parseLogs } from '@/util/events';
import { InternalServerError } from '@/util/errors';
import { logger } from '@/util/logger';
import { paginatedResults } from '@/util/pagination';
import TransactionService from './TransactionService';
import InfuraService from './InfuraService';

async function get(assetPool: TAssetPool, depositId: number): Promise<DepositDocument> {
    return await Deposit.findOne({ poolAddress: assetPool.address, id: depositId });
}

async function getAllPaginated(query: { receiver: string }, page = 1, limit = 10) {
    return paginatedResults(Deposit, page, limit, query);
}

async function getAll(assetPool: TAssetPool): Promise<DepositDocument[]> {
    return await Deposit.find({ poolAddress: assetPool.address });
}

async function deposit(
    assetPool: TAssetPool,
    account: IAccount,
    amount: string,
    callData: { call: string; nonce: number; sig: string },
    item: string,
) {
    const deposit = await Deposit.create({
        sub: account.id,
        sender: account.address,
        receiver: assetPool.address,
        amount,
        state: DepositState.Pending,
        item,
    });

    if (ITX_ACTIVE) {
        const tx = await InfuraService.schedule(
            assetPool.address,
            'call',
            [callData.call, callData.nonce, callData.sig],
            assetPool.network,
        );
        deposit.transactions.push(String(tx._id));

        return await deposit.save();
    } else {
        try {
            const { tx, receipt } = await TransactionService.send(
                assetPool.address,
                assetPool.contract.methods.call(callData.call, callData.nonce, callData.sig),
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

async function depositForAdmin(assetPool: TAssetPool, account: IAccount, amount: string) {
    const deposit = await Deposit.create({
        sub: account.id,
        sender: account.address,
        receiver: assetPool.address,
        amount,
        state: DepositState.Pending,
    });

    if (ITX_ACTIVE) {
        const tx = await InfuraService.schedule(assetPool.address, 'deposit', [amount], assetPool.network);

        deposit.transactions.push(String(tx._id));

        return await deposit.save();
    } else {
        try {
            const { tx, receipt } = await TransactionService.send(
                assetPool.address,
                assetPool.contract.methods.deposit(amount),
                assetPool.network,
                500000,
            );

            const events = parseLogs(assetPool.contract.options.jsonInterface, receipt.logs);

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

export default { get, getAll, getAllPaginated, deposit, depositForAdmin };
