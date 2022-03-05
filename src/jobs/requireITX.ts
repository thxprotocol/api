import { Transaction, TransactionDocument } from '@/models/Transaction';
import { TransactionType } from '@/types/enums';

export async function jobRequireInfuraTransaction() {
    const transactions = await Transaction.find({ type: TransactionType.ITX });

    transactions.forEach(async (d: TransactionDocument) => {
        //
    });
}
