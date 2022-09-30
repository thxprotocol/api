import { Document } from 'mongoose';
import { Contract } from 'web3-eth-contract';
import { Transaction, TransactionDocument } from '@/models/Transaction';
import { getProvider } from '@/util/network';
import { ChainId, TransactionState, TransactionType } from '@/types/enums';
import { MINIMUM_GAS_LIMIT, RELAYER_SPEED } from '@/config/secrets';
import { CustomEventLog, parseLogs } from '@/util/events';
import { paginatedResults } from '@/util/pagination';
import { TTransaction, TTransactionCallback } from '@/types/TTransaction';
import { TransactionReceipt } from 'web3-core';
import { toChecksumAddress } from 'web3-utils';
import { poll } from '@/util/polling';
import { deployCallback as erc20DeployCallback } from './ERC20Service';
import AssetPoolService from './AssetPoolService';

function getById(id: string) {
    return Transaction.findById(id);
}

async function sendValue(to: string, value: string, chainId: ChainId) {
    const { web3, defaultAccount } = getProvider(chainId);
    const from = defaultAccount;
    const gas = '21000';

    let tx = await Transaction.create({
        state: TransactionState.Queued,
        chainId,
        from,
        to,
        gas,
    });

    const receipt = await web3.eth.sendTransaction({
        from,
        to,
        value,
        gas,
    });

    if (receipt.transactionHash) {
        tx.transactionHash = receipt.transactionHash;
        tx.state = TransactionState.Mined;
        tx = await tx.save();
    }

    return { tx, receipt };
}

async function getReceipt(
    chainId: ChainId,
    tx: TransactionReceipt,
    confirmations: number,
): Promise<TransactionReceipt> {
    const { web3 } = getProvider(chainId);
    return new Promise((resolve, reject) => {
        let counter = 0;
        const interval = setInterval(async function () {
            const receipt = await web3.eth.getTransactionReceipt(tx.transactionHash);
            if (receipt) {
                clearInterval(interval);
                resolve(receipt);
            }
            if (counter === confirmations) reject();
            counter++;
        }, 500);
    });
}

async function relay(
    contract: Contract,
    fn: string,
    args: any[],
    chainId: ChainId,
    callback: (tx: TransactionDocument, events?: CustomEventLog[]) => Promise<Document>,
): Promise<any> {
    const tx = await queue(contract.options.address, fn, args, chainId);
    const receipt = await send(contract.options.address, contract.methods[fn](...args), chainId);
    const minedReceipt = await getReceipt(chainId, receipt, 3);
    const events = parseLogs(contract.options.jsonInterface, minedReceipt.logs);

    await tx.updateOne({
        state: TransactionState.Mined,
        gas: receipt.gasUsed,
    });

    return await callback(tx, events);
}

async function send(to: string, fn: any, chainId: ChainId, gasLimit?: number) {
    const { web3, defaultAccount } = getProvider(chainId);
    const from = defaultAccount;
    const data = fn.encodeABI();
    const estimate = await fn.estimateGas({ from });
    const gas = gasLimit ? gasLimit : estimate < MINIMUM_GAS_LIMIT ? MINIMUM_GAS_LIMIT : estimate;

    return await web3.eth.sendTransaction({
        from,
        to,
        data,
        gas,
    });
}

async function sendAsync(to: string, fn: any, chainId: ChainId, forceSync = true, callback?: TTransactionCallback) {
    const { web3, relayer, defaultAccount } = getProvider(chainId);
    const data = fn.encodeABI();
    const tx = await Transaction.create({
        type: relayer && !forceSync ? TransactionType.Relayed : TransactionType.Default,
        state: TransactionState.Queued,
        from: defaultAccount,
        to: to.toUpperCase(),
        chainId,
        callback,
    });

    if (relayer) {
        const defenderTx = await relayer.sendTransaction({
            data,
            speed: RELAYER_SPEED,
            gasLimit: 1000000,
        });

        Object.assign(tx, {
            transactionId: defenderTx.transactionId,
            transactionHash: defenderTx.hash,
            state: TransactionState.Sent,
        });

        await tx.save();

        if (forceSync) {
            await poll(
                async () => {
                    const transaction = await getById(tx._id);
                    return queryTransactionStatusReceipt(transaction);
                },
                (trans: TTransaction) => trans.state === TransactionState.Sent,
                1000,
            );
        }
    } else {
        const estimate = await fn.estimateGas({ from: defaultAccount });
        const gas = estimate < MINIMUM_GAS_LIMIT ? MINIMUM_GAS_LIMIT : estimate;

        const receipt = await web3.eth.sendTransaction({
            from: defaultAccount,
            to,
            data,
            gas,
        });

        await transactionMined(tx, receipt);
    }

    // We return the id because the transaction might be out of date.
    return String(tx._id);
}

async function queue(to: string, method: string, params: string[], chainId: ChainId) {
    const { web3, defaultAccount } = getProvider(chainId);
    const nonce = await web3.eth.getTransactionCount(defaultAccount, 'pending');

    return await Transaction.create({
        state: TransactionState.Queued,
        from: defaultAccount,
        call: { fn: method, args: JSON.stringify(params) },
        chainId,
        to,
        nonce,
    });
}

async function deploy(abi: any, bytecode: any, arg: any[], chainId: ChainId) {
    const { web3, defaultAccount } = getProvider(chainId);
    const contract = new web3.eth.Contract(abi);
    const gas = await contract
        .deploy({
            data: bytecode,
            arguments: arg,
        })
        .estimateGas();
    const data = contract
        .deploy({
            data: bytecode,
            arguments: arg,
        })
        .encodeABI();

    const tx = await Transaction.create({
        type: TransactionType.Default,
        state: TransactionState.Queued,
        from: defaultAccount,
        chainId,
        gas,
    });

    const receipt = await web3.eth.sendTransaction({
        from: defaultAccount,
        data,
        gas,
    });

    if (receipt.transactionHash) {
        await tx.updateOne({
            to: receipt.to,
            transactionHash: receipt.transactionHash,
            state: TransactionState.Mined,
        });
    }

    contract.options.address = receipt.contractAddress;

    return contract;
}

async function deployAsync(
    abi: any,
    bytecode: any,
    arg: any[],
    chainId: ChainId,
    forceSync = true,
    callback?: TTransactionCallback,
) {
    const { web3, relayer, defaultAccount } = getProvider(chainId);
    const contract = new web3.eth.Contract(abi);

    const tx = await Transaction.create({
        type: relayer && !forceSync ? TransactionType.Relayed : TransactionType.Default,
        state: TransactionState.Queued,
        from: defaultAccount,
        chainId,
        callback,
    });

    const data = contract
        .deploy({
            data: bytecode,
            arguments: arg,
        })
        .encodeABI();

    if (relayer) {
        const defenderTx = await relayer.sendTransaction({
            data,
            speed: RELAYER_SPEED,
            gasLimit: 1000000,
        });

        Object.assign(tx, {
            transactionId: defenderTx.transactionId,
            transactionHash: defenderTx.hash,
            state: TransactionState.Sent,
        });

        await tx.save();

        if (forceSync) {
            await poll(
                async () => {
                    const transaction = await getById(tx._id);
                    return queryTransactionStatusReceipt(transaction);
                },
                (trans: TTransaction) => trans.state === TransactionState.Sent,
                1000,
            );
        }
    } else {
        const gas = await contract
            .deploy({
                data: bytecode,
                arguments: arg,
            })
            .estimateGas();

        const receipt = await web3.eth.sendTransaction({
            from: defaultAccount,
            data,
            gas,
        });

        await transactionMined(tx, receipt);
    }

    // We return the id because the transaction might be out of date.
    return String(tx._id);
}

async function transactionMined(tx: TransactionDocument, receipt: TransactionReceipt) {
    Object.assign(tx, {
        transactionHash: receipt.transactionHash,
        state: TransactionState.Mined,
    });

    if (receipt.to) {
        Object.assign(tx, { to: toChecksumAddress(receipt.to) });
    }

    if (tx.callback) {
        await executeCallback(tx, receipt);
    }

    await tx.save();
}

async function executeCallback(tx: TransactionDocument, receipt: TransactionReceipt) {
    switch (tx.callback.type) {
        case 'Erc20DeployCallback':
            await erc20DeployCallback(tx.callback.args, receipt);
            break;
        case 'assetPoolDeployCallback':
            await AssetPoolService.deployCallback(tx.callback.args, receipt);
            break;
        case 'topupCallback':
            await AssetPoolService.topupCallback(tx.callback.args, receipt);
            break;
    }
}

async function queryTransactionStatusDefender(tx: TransactionDocument) {
    if ([TransactionState.Mined, TransactionState.Failed].includes(tx.state)) {
        return tx;
    }
    const { web3, relayer } = getProvider(tx.chainId);

    const defenderTx = await relayer.query(tx.transactionId);

    // Hash has been updated
    if (tx.transactionHash != defenderTx.hash) {
        tx.transactionHash = defenderTx.hash;
        await tx.save();
    }

    if (['mined', 'confirmed'].includes(defenderTx.status)) {
        const receipt = await web3.eth.getTransactionReceipt(tx.transactionHash);
        await transactionMined(tx, receipt);
    } else if (defenderTx.status === 'failed') {
        tx.state = TransactionState.Failed;
        await tx.save();
    }

    return tx;
}

async function queryTransactionStatusReceipt(tx: TransactionDocument) {
    if ([TransactionState.Mined, TransactionState.Failed].includes(tx.state)) {
        return tx;
    }
    const { web3 } = getProvider(tx.chainId);

    const receipt = await web3.eth.getTransactionReceipt(tx.transactionHash);

    if (receipt) {
        await transactionMined(tx, receipt);
    }

    return tx;
}

async function findFailReason(transactions: string[]): Promise<string | undefined> {
    const list = await Promise.all(transactions.map((id: string) => getById(id)));
    const tx = list.filter((tx: TTransaction) => tx.state === TransactionState.Failed);
    if (!tx.length) return;

    return tx[0].failReason;
}

async function findByQuery(poolAddress: string, page = 1, limit = 10, startDate?: Date, endDate?: Date) {
    let query;
    if (startDate && !endDate) {
        query = { to: poolAddress, createdAt: { $gte: startDate } };
    } else if (startDate && endDate) {
        query = { to: poolAddress, createdAt: { $gte: startDate, $lt: endDate } };
    } else if (!startDate && endDate) {
        query = { to: poolAddress, createdAt: { $lt: endDate } };
    } else {
        query = { to: poolAddress };
    }
    return await paginatedResults(Transaction, page, limit, query);
}

export default {
    relay,
    getById,
    send,
    sendAsync,
    deploy,
    deployAsync,
    sendValue,
    findByQuery,
    findFailReason,
    queryTransactionStatusDefender,
    queryTransactionStatusReceipt,
};
