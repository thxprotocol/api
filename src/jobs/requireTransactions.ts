import AssetPoolService from '@/services/AssetPoolService';
import InfuraService from '@/services/InfuraService';
import { findEvent, hex2a, parseLogs } from '@/util/events';
import { Transaction } from '@/models/Transaction';
import { Artifacts } from '@/config/contracts/artifacts';
import { Withdrawal } from '@/models/Withdrawal';
import { logger } from '@/util/logger';
import MemberService from '@/services/MemberService';
import { DepositState, TransactionState, TransactionType, WithdrawalState } from '@/types/enums';
import { Deposit } from '@/models/Deposit';

export async function jobProcessTransactions() {
    const transactions = await Transaction.find({
        state: TransactionState.Pending,
        type: TransactionType.ITX,
        transactionHash: { $exists: false },
    }).sort({ createdAt: 'asc' });

    for (let tx of transactions) {
        const assetPool = await AssetPoolService.getByAddress(tx.to);
        // If the TX does not have a relayTransactionHash yet, send it first. This might occur if
        // a tx is scheduled but not send yet.
        if (!tx.relayTransactionHash) {
            tx = await InfuraService.send(tx);
        }
        // Poll for the receipt. This will return the receipt immediately if the tx has already been mined.
        const receipt = await InfuraService.pollTransactionStatus(assetPool, tx);
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
    }
}
