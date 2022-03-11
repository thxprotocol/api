import AssetPoolService from '@/services/AssetPoolService';
import InfuraService from '@/services/InfuraService';
import { findEvent, hex2a, parseLogs } from '@/util/events';
import { Transaction, TransactionDocument } from '@/models/Transaction';
import { Artifacts } from '@/config/contracts/artifacts';
import { Withdrawal } from '@/models/Withdrawal';
import { logger } from '@/util/logger';
import MemberService from '@/services/MemberService';
import { Member } from '@/models/Member';

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

        if (!result.args.success) {
            const error = hex2a(result.args.data.substr(10));

            logger.error(error);

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
            await Withdrawal.updateOne(
                { transactions: String(tx._id) },
                {
                    withdrawalId: Number(event.args.id),
                    poolAddress: assetPool.address,
                    failReason: '',
                },
            );
        }

        const roleGranted = findEvent('RoleGranted', events);
        if (roleGranted) {
            await MemberService.addExistingMember(assetPool, roleGranted.args.account);
        }
    });
}
