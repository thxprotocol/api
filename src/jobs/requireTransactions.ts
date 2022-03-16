import AssetPoolService from '@/services/AssetPoolService';
import InfuraService from '@/services/InfuraService';
import { findEvent, hex2a, parseLogs } from '@/util/events';
import { Transaction, TransactionDocument } from '@/models/Transaction';
import { Withdrawal } from '@/models/Withdrawal';
import { logger } from '@/util/logger';
import MemberService from '@/services/MemberService';
import { DepositState, WithdrawalState } from '@/types/enums';
import { Deposit } from '@/models/Deposit';

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

        const events = parseLogs(assetPool.contract.options.jsonInterface, receipt.logs);
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

        const eventDepositted = findEvent('Depositted', events);
        const eventRoleGranted = findEvent('RoleGranted', events);
        const eventWithdrawPollCreated = findEvent('WithdrawPollCreated', events);
        const eventWithdrawPollFinalized = findEvent('WithdrawPollFinalized', events);
        const eventWithdrawn = findEvent('Withdrawn', events);

        if (eventDepositted) {
            const deposit = await Deposit.findOne({ transactions: String(tx._id) });
            deposit.transactions.push(String(tx._id));
            deposit.state = DepositState.Completed;
            await deposit.save();
        }

        if (eventRoleGranted) {
            await MemberService.addExistingMember(assetPool, eventRoleGranted.args.account);
        }

        if (eventWithdrawPollCreated) {
            const withdrawal = await Withdrawal.findOne({ transactions: String(tx._id) });
            await withdrawal.updateOne({
                withdrawalId: Number(eventWithdrawPollCreated.args.id),
                poolAddress: assetPool.address,
                failReason: '',
            });
        }

        if (eventWithdrawPollFinalized && eventWithdrawn) {
            const withdrawal = await Withdrawal.findOne({ transactions: String(tx._id) });
            await withdrawal.updateOne({ state: WithdrawalState.Withdrawn });
        }
    });
}
