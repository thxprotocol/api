import { TransactionState, TransactionType } from '@/types/enums';
import { Transaction, TransactionDocument } from '@/models/Transaction';
import { logger } from '@/util/logger';
import TransactionService from '@/services/TransactionService';

export async function updatePendingTransactions() {
    const transactions: TransactionDocument[] = await Transaction.find({
        state: TransactionState.Sent,
        type: TransactionType.Relayed,
    }).sort({ createdAt: 'asc' });

    for (const tx of transactions) {
        TransactionService.queryTransactionStatusDefender(tx).catch((error) => logger.error(error));
    }
}
