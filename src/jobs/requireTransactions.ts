import AssetPoolService from '@/services/AssetPoolService';
import InfuraService from '@/services/InfuraService';
import { findEvent, hex2a, parseLogs } from '@/util/events';
import { Transaction, TransactionDocument } from '@/models/Transaction';
import { Artifacts } from '@/config/contracts/artifacts';
import { Withdrawal } from '@/models/Withdrawal';
import { logger } from '@/util/logger';
import MemberService from '@/services/MemberService';
import { Member } from '@/models/Member';
import { WithdrawalState } from '@/types/enums';

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
        const withdrawal = await Withdrawal.findOne({ transactions: String(tx._id) });

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

        const eventWithdrawPollCreated = findEvent('WithdrawPollCreated', events);
        if (eventWithdrawPollCreated) {
            await withdrawal.updateOne({
                withdrawalId: Number(eventWithdrawPollCreated.args.id),
                poolAddress: assetPool.address,
                failReason: '',
            });
        }

        const eventRoleGranted = findEvent('RoleGranted', events);
        if (eventRoleGranted) {
            await MemberService.addExistingMember(assetPool, eventRoleGranted.args.account);
        }

        const eventWithdrawPollFinalized = findEvent('WithdrawPollFinalized', events);
        const eventWithdrawn = findEvent('Withdrawn', events);
        if (eventWithdrawPollFinalized && eventWithdrawn) {
            await withdrawal.updateOne({ state: WithdrawalState.Withdrawn });
        }
    });
}
