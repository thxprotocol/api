import AssetPoolService from '@/services/AssetPoolService';
import InfuraService from '@/services/InfuraService';
import { CustomEventLog, findEvent, hex2a, parseLogs } from '@/util/events';
import { Withdrawal } from '@/models/Withdrawal';
import { logger } from '@/util/logger';
import MemberService from '@/services/MemberService';
import { DepositState, TransactionState, TransactionType, WithdrawalState } from '@/types/enums';
import { Deposit } from '@/models/Deposit';
import { wrapBackgroundTransaction } from '@/util/newrelic';
import { AssetPoolType } from '@/models/AssetPool';
import { Transaction, TransactionDocument } from '@/models/Transaction';
import { EventLog, TransactionReceipt } from 'web3-core';
import { TTransaction } from '@/types/TTransaction';

async function handleEvents(assetPool: AssetPoolType, tx: TransactionDocument, events: CustomEventLog[]) {
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
        await Withdrawal.updateOne(
            { transactions: String(tx._id) },
            {
                withdrawalId: Number(eventWithdrawPollCreated.args.id),
                poolAddress: assetPool.address,
                failReason: '',
            },
        );
    }

    if (eventWithdrawPollFinalized && eventWithdrawn) {
        await Withdrawal.updateOne(
            { transactions: String(tx._id) },
            { state: WithdrawalState.Withdrawn, failReason: '' },
        );
    }
}

async function handleError(tx: TransactionDocument, failReason: string) {
    await Withdrawal.updateOne({ transactions: String(tx._id) }, { failReason });
    await Deposit.updateOne({ transactions: String(tx._id) }, { failReason });
}

export async function jobProcessTransactions() {
    const transactions: TransactionDocument[] = await Transaction.find({
        state: TransactionState.Pending,
        type: TransactionType.ITX,
        transactionHash: { $exists: false },
    }).sort({ createdAt: 'asc' });

    for (const tx of transactions) {
        try {
            const assetPool = await AssetPoolService.getByAddress(tx.to);
            // If the TX does not have a relayTransactionHash yet, send it first. This might occur if
            // a tx is scheduled but not send yet.
            if (!tx.relayTransactionHash) {
                (await wrapBackgroundTransaction(
                    'jobRequireTransactions',
                    'send',
                    InfuraService.send(tx),
                )) as TransactionDocument;
                return;
            }
            // Poll for the receipt. This will return the receipt immediately if the tx has already been mined.
            const receipt = (await wrapBackgroundTransaction(
                'jobRequireTransactions',
                'pollTransactionStatus',
                InfuraService.pollTransactionStatus(assetPool, tx),
            )) as TransactionReceipt;

            if (!receipt) return;

            const events = parseLogs(assetPool.contract.options.jsonInterface, receipt.logs);
            const result = findEvent('Result', events);

            if (!result) return;
            if (!result.args.success) {
                const failReason = hex2a(result.args.data.substr(10));
                logger.error(failReason);
                await handleError(tx, failReason);
            }
            if (result.args.success) {
                await handleEvents(assetPool, tx, events);
            }
        } catch (error) {
            await handleError(tx, error.message);
        }
    }
}
