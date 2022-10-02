import { TransactionState, TransactionType } from '@/types/enums';
import { Transaction, TransactionDocument } from '@/models/Transaction';
import { logger } from '@/util/logger';
import TransactionService from '@/services/TransactionService';

export async function checkReceipts() {
    const transactions: TransactionDocument[] = await Transaction.find({
        state: TransactionState.Sent,
        type: TransactionType.Relayed,
    }).sort({ createdAt: 'asc' });

    for (const tx of transactions) {
        try {
            TransactionService.queryTransactionStatusReceipt(tx);
        } catch (error) {
            logger.error(error);
        }
    }
}
