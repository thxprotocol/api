import AssetPoolService from '@/services/AssetPoolService';
import InfuraService from '@/services/InfuraService';
import { findEvent, hex2a, parseLogs } from '@/util/events';
import { Transaction, TransactionDocument } from '@/models/Transaction';
import { Artifacts } from '@/config/contracts/artifacts';
import { Withdrawal } from '@/models/Withdrawal';
import { logger } from '@/util/logger';

export async function jobRequireTransactions() {
    const transactions = await Transaction.find({
        relayTransactionHash: { $exists: true },
        transactionHash: { $exists: false },
    });

    transactions.forEach(async (tx: TransactionDocument) => {
        // Assumes that tx.to always is an AssetPool address
        const assetPool = await AssetPoolService.getByAddress(tx.to);
        const receipt = await InfuraService.getTransactionStatus(assetPool, tx);
        if (!receipt) return;

        const events = parseLogs(Artifacts.IDefaultDiamond.abi, receipt.logs);
        const result = findEvent('Result', events);

        console.log(events);

        if (!result.args.success) {
            const error = hex2a(result.args.data.substr(10));

            logger.error(error);

            // TODO Store the events in this receipt to query later
            // TODO No longer update withdrawals but respond with data based on events in the database
            await Withdrawal.updateOne(
                { transactions: String(tx._id) },
                {
                    poolAddress: assetPool.address,
                    failReason: 'Error: ' + error,
                },
            );
            return;
        }

        const event = findEvent('WithdrawPollCreated', events);
        if (event) {
            // TODO Store the events in this receipt to query later
            // TODO No longer update withdrawals but respond with data based on events in the database
            await Withdrawal.updateOne(
                { transactions: String(tx._id) },
                {
                    withdrawalId: Number(event.args.id),
                    poolAddress: assetPool.address,
                    failReason: '',
                },
            );
        }
    });
}
