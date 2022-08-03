import { TransactionState, TransactionType } from '@/types/enums';
import { Transaction, TransactionDocument } from '@/models/Transaction';

export async function jobProcessTransactions() {
    const transactions: TransactionDocument[] = await Transaction.find({
        $or: [{ state: TransactionState.Scheduled }, { state: TransactionState.Sent }],
        type: TransactionType.Relayed,
        transactionHash: { $exists: false },
    }).sort({ createdAt: 'asc' });

    for (const tx of transactions) {
        try {
            console.log(tx);
            //
        } catch (error) {
            //
        }
    }
}
