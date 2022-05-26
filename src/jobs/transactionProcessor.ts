import AssetPoolService from '@/services/AssetPoolService';
import InfuraService from '@/services/InfuraService';
import { findEvent, hex2a, parseLogs } from '@/util/events';
import { TransactionState, TransactionType } from '@/types/enums';
import { wrapBackgroundTransaction } from '@/util/newrelic';
import { Transaction, TransactionDocument } from '@/models/Transaction';
import { TransactionReceipt } from 'web3-core';
import { handleError, handleEvents } from '@/util/jobs';
import { DiamondVariant } from '@thxnetwork/artifacts';
import { ethers } from 'ethers';
import { getContractConfig, getDiamondAbi } from '@/config/contracts';

async function getContractForTransaction(tx: TransactionDocument) {
    const { admin } = InfuraService.getProvider(tx.network);
    const pool = await AssetPoolService.getByAddress(tx.to);
    let abi: ethers.ContractInterface;

    if (pool) {
        abi = getDiamondAbi(tx.network, pool.variant as DiamondVariant) as unknown as ethers.ContractInterface;
    }

    if (tx.to === getContractConfig(tx.network, 'PoolFactory').address) {
        abi = getDiamondAbi(tx.network, 'poolFactory') as unknown as ethers.ContractInterface;
    }

    if (tx.to === getContractConfig(tx.network, 'TokenFactory').address) {
        abi = getDiamondAbi(tx.network, 'tokenFactory') as unknown as ethers.ContractInterface;
    }

    return { contract: new ethers.Contract(tx.to, abi, admin), abi };
}

export async function jobProcessTransactions() {
    const transactions: TransactionDocument[] = await Transaction.find({
        $or: [{ state: TransactionState.Scheduled }, { state: TransactionState.Sent }],
        type: TransactionType.ITX,
        transactionHash: { $exists: false },
    }).sort({ createdAt: 'asc' });

    for (const tx of transactions) {
        try {
            // Get the related ethers contract for this transaction (pool, poolFactory, tokenFactory)
            const { contract, abi } = await getContractForTransaction(tx);
            // If the TX does not have a relayTransactionHash yet, send it first. This might occur if
            // a tx is scheduled but not send yet.
            if (!tx.relayTransactionHash) {
                (await wrapBackgroundTransaction(
                    'jobRequireTransactions',
                    'send',
                    InfuraService.send(contract, tx),
                )) as TransactionDocument;
                return;
            }

            if (tx.state === TransactionState.Sent) {
                // Poll for the receipt. This will return the receipt immediately if the tx has already been mined.
                const receipt = (await wrapBackgroundTransaction(
                    'jobRequireTransactions',
                    'pollTransactionStatus',
                    InfuraService.pollTransactionStatus(tx),
                )) as TransactionReceipt;

                if (!receipt) return;

                const events = parseLogs(abi, receipt.logs);
                const result = findEvent('Result', events);

                if (result && !result.args.success) {
                    await handleError(tx, hex2a(result.args.data.substr(10)));
                }
                if (result.args.success) {
                    await handleEvents(tx, events);
                }
            }
        } catch (error) {
            await handleError(tx, error.message);
        }
    }
}
