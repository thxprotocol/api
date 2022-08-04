import { Document } from 'mongoose';
import { Contract } from 'web3-eth-contract';
import { Transaction, TransactionDocument } from '@/models/Transaction';
import { getProvider } from '@/util/network';
import { ChainId, TransactionState, TransactionType } from '@/types/enums';
import { MINIMUM_GAS_LIMIT } from '@/config/secrets';
import { AssetPool } from '@/models/AssetPool';
import { CustomEventLog, findEvent, hex2a, parseLogs } from '@/util/events';
import { logger } from '@/util/logger';
import { InternalServerError } from '@/util/errors';
import { paginatedResults } from '@/util/pagination';
import { TTransaction } from '@/types/TTransaction';

function getById(id: string) {
    return Transaction.findById(id);
}

async function sendValue(to: string, value: string, chainId: ChainId) {
    const { web3, defaultAccount } = getProvider(chainId);
    const from = defaultAccount;
    const gas = '21000';

    // Prepare the Transaction and store in database so it could be retried if it fails
    let tx = await Transaction.create({
        type: TransactionType.Default,
        state: TransactionState.Scheduled,
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

async function relay(
    contract: Contract,
    fn: string,
    args: any[],
    chainId: ChainId,
    callback: (tx: TransactionDocument, events?: CustomEventLog[]) => Promise<Document>,
    gasLimit?: number,
): Promise<any> {
    const { tx, receipt } = await send(contract.options.address, contract.methods[fn](...args), chainId, gasLimit);
    const events = parseLogs(contract.options.jsonInterface, receipt.logs);
    const result = findEvent('Result', events);

    if (result && !result.args.success) {
        const error = hex2a(result.args.data.substr(10));
        logger.error(error);
        throw new InternalServerError(error);
    }

    return await callback(tx, events);
}

async function send(to: string, fn: any, chainId: ChainId, gasLimit?: number, fromPK?: string) {
    const { web3, defaultAccount } = getProvider(chainId);
    const from = fromPK ? web3.eth.accounts.privateKeyToAccount(fromPK).address : defaultAccount;
    const data = fn.encodeABI();
    const estimate = await fn.estimateGas({ from });
    const gas = gasLimit ? gasLimit : estimate < MINIMUM_GAS_LIMIT ? MINIMUM_GAS_LIMIT : estimate;
    const nonce = await web3.eth.getTransactionCount(from, 'pending');

    // Prepare the Transaction and store in database so it could be retried if it fails
    let tx = await Transaction.create({
        type: TransactionType.Default,
        state: TransactionState.Scheduled,
        chainId,
        from,
        to,
        gas,
        nonce,
    });

    const receipt = await web3.eth.sendTransaction({
        from: defaultAccount,
        to,
        data,
        gas,
    });

    if (receipt.transactionHash) {
        tx.transactionHash = receipt.transactionHash;
        tx.state = TransactionState.Mined;
        tx = await tx.save();

        // Update lastTransactionAt value for the pool if the address is a pool
        await AssetPool.updateOne({ address: tx.to, chainId: tx.chainId }, { lastTransactionAt: Date.now() });
    }

    return { tx, receipt };
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
        state: TransactionState.Scheduled,
        chainId,
        from: defaultAccount,
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
    const result = await paginatedResults(Transaction, page, limit, query);
    return result;
}

export default { relay, getById, send, deploy, sendValue, findByQuery, findFailReason };
