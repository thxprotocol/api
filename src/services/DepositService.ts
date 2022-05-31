import { TAssetPool } from '@/types/TAssetPool';
import { Deposit, DepositDocument } from '@/models/Deposit';
import { IAccount } from '@/models/Account';
import { DepositState } from '@/types/enums/DepositState';
import TransactionService from './TransactionService';
import InfuraService from './InfuraService';
import { ITX_ACTIVE } from '@/config/secrets';
import { assertEvent, CustomEventLog, findEvent, hex2a, parseLogs } from '@/util/events';
import { InternalServerError } from '@/util/errors';
import { logger } from '@/util/logger';
import { TransactionDocument } from '@/models/Transaction';

async function get(assetPool: TAssetPool, depositId: number): Promise<DepositDocument> {
    const deposit = await Deposit.findOne({ poolAddress: assetPool.address, id: depositId });
    if (!deposit) return null;
    return deposit;
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
        const tx = await InfuraService.create(
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

export default { get, getAll, deposit };
