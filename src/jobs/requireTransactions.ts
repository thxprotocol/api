import AssetPoolService from '@/services/AssetPoolService';
import InfuraService from '@/services/InfuraService';
import { findEvent, hex2a, parseLogs } from '@/util/events';
import { TransactionState, TransactionType } from '@/types/enums';
import { wrapBackgroundTransaction } from '@/util/newrelic';
import { AssetPool } from '@/models/AssetPool';
import { Transaction, TransactionDocument } from '@/models/Transaction';
import { TransactionReceipt } from 'web3-core';
import { handleError, handleEvents } from '@/util/jobs';
import { InternalServerError } from '@/util/errors';

export async function jobProcessTransactions() {
    const transactions: TransactionDocument[] = await Transaction.find({
        $or: [{ state: TransactionState.Scheduled }, { state: TransactionState.Sent }],
        type: TransactionType.ITX,
        transactionHash: { $exists: false },
    }).sort({ createdAt: 'asc' });

    for (const tx of transactions) {
        try {
            const pool = await AssetPoolService.getByAddress(tx.to);
            // If the TX does not have a relayTransactionHash yet, send it first. This might occur if
            // a tx is scheduled but not send yet.
            if (!tx.relayTransactionHash) {
                (await wrapBackgroundTransaction(
                    'jobRequireTransactions',
                    'send',
                    InfuraService.send(pool, tx),
                )) as TransactionDocument;
                return;
            }

            if (tx.state === TransactionState.Sent) {
                // Poll for the receipt. This will return the receipt immediately if the tx has already been mined.
                const receipt = (await wrapBackgroundTransaction(
                    'jobRequireTransactions',
                    'pollTransactionStatus',
                    InfuraService.pollTransactionStatus(pool, tx),
                )) as TransactionReceipt;

                if (!receipt) return;

                const events = parseLogs(pool.contract.options.jsonInterface, receipt.logs);
                const result = findEvent('Result', events);

                if (!result) {
                    throw new InternalServerError('No result found in receipt');
                }
                if (!result.args.success) {
                    await handleError(tx, hex2a(result.args.data.substr(10)));
                }
                if (result.args.success) {
                    await AssetPool.findOneAndUpdate({ address: tx.to }, { lastTransactionAt: Date.now() });
                    await handleEvents(pool, tx, events);
                }
            }
        } catch (error) {
            await handleError(tx, error.message);
        }
    }
}
