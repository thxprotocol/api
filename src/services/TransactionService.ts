import { Document } from 'mongoose';
import { toWei } from 'web3-utils';
import { Contract } from 'web3-eth-contract';
import { Transaction, TransactionDocument } from '@/models/Transaction';
import { getEstimatesFromOracle, getProvider, MaxFeePerGasExceededError } from '@/util/network';
import { NetworkProvider, TransactionState, TransactionType } from '@/types/enums';
import { ITX_ACTIVE, MAX_FEE_PER_GAS, MINIMUM_GAS_LIMIT, PRIVATE_KEY } from '@/config/secrets';
import { AssetPool } from '@/models/AssetPool';
import AssetPoolService from './AssetPoolService';
import InfuraService from './InfuraService';
import { CustomEventLog, findEvent, hex2a, parseLogs } from '@/util/events';
import { logger } from '@/util/logger';
import { InternalServerError } from '@/util/errors';
import { paginatedResults } from '@/util/pagination';

function getById(id: string) {
    return Transaction.findById(id);
}

function parseFee(value: number, npid: NetworkProvider) {
    return Number(toWei(String(Math.ceil(value + (npid === NetworkProvider.Test ? 30 : 0))), 'gwei'));
}

async function sendValue(to: string, value: string, npid: NetworkProvider) {
    const { web3, admin } = getProvider(npid);
    const from = admin.address;
    const gas = '21000';
    const nonce = await web3.eth.getTransactionCount(from, 'pending');
    const feeData = await getEstimatesFromOracle(npid);
    const baseFee = Number(feeData.baseFee);
    const maxFeePerGas = parseFee(feeData.maxFeePerGas, npid);
    const maxPriorityFeePerGas = parseFee(feeData.maxPriorityFeePerGas, npid);
    const maxFeePerGasLimit = Number(toWei(MAX_FEE_PER_GAS, 'gwei'));

    // This comparison is in gwei
    if (maxFeePerGasLimit > 0 && maxFeePerGas > maxFeePerGasLimit) {
        throw new MaxFeePerGasExceededError();
    }

    const sig = await web3.eth.accounts.signTransaction(
        {
            gas,
            to,
            from,
            maxPriorityFeePerGas,
            value,
            nonce,
        },
        PRIVATE_KEY,
    );

    // Prepare the Transaction and store in database so it could be retried if it fails
    let tx = await Transaction.create({
        type: TransactionType.Default,
        state: TransactionState.Scheduled,
        network: npid,
        from,
        to,
        gas,
        nonce,
        baseFee,
        maxFeePerGas,
        maxPriorityFeePerGas,
    });

    const receipt = await web3.eth.sendSignedTransaction(sig.rawTransaction);

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
    npid: NetworkProvider,
    callback: (tx: TransactionDocument, events?: CustomEventLog[]) => Promise<Document>,
): Promise<any> {
    // If ITX is active run the callback for the scheduled ITX transaction right away
    if (ITX_ACTIVE) {
        return await callback(await InfuraService.create(contract.options.address, fn, args, npid));
    }

    const { tx, receipt } = await send(contract.options.address, contract.methods[fn](...args), npid);
    const events = parseLogs(contract.options.jsonInterface, receipt.logs);
    const result = findEvent('Result', events);

    if (result && !result.args.success) {
        const error = hex2a(result.args.data.substr(10));
        logger.error(error);
        throw new InternalServerError(error);
    }

    return await callback(tx, events);
}

async function send(to: string, fn: any, npid: NetworkProvider, gasLimit?: number, fromPK?: string) {
    const { web3, admin } = getProvider(npid);
    const from = fromPK ? web3.eth.accounts.privateKeyToAccount(fromPK).address : admin.address;
    const data = fn.encodeABI();
    const estimate = await fn.estimateGas({ from });
    // MINIMUM_GAS_LIMIT is set for tx that have a lower estimate than allowed by the network
    const gas = gasLimit ? gasLimit : estimate < MINIMUM_GAS_LIMIT ? MINIMUM_GAS_LIMIT : estimate;
    const nonce = await web3.eth.getTransactionCount(from, 'pending');
    const feeData = await getEstimatesFromOracle(npid);
    const baseFee = Number(feeData.baseFee);
    const maxFeePerGas = parseFee(feeData.maxFeePerGas, npid);
    const maxPriorityFeePerGas = parseFee(feeData.maxPriorityFeePerGas, npid);
    const maxFeePerGasLimit = Number(toWei(MAX_FEE_PER_GAS, 'gwei'));

    // This comparison is in gwei
    if (maxFeePerGasLimit > 0 && maxFeePerGas > maxFeePerGasLimit) {
        throw new MaxFeePerGasExceededError();
    }

    const sig = await web3.eth.accounts.signTransaction(
        {
            gas,
            to,
            from,
            maxPriorityFeePerGas,
            data,
            nonce,
        },
        fromPK || PRIVATE_KEY,
    );

    // Prepare the Transaction and store in database so it could be retried if it fails
    let tx = await Transaction.create({
        type: TransactionType.Default,
        state: TransactionState.Scheduled,
        network: npid,
        from,
        to,
        gas,
        nonce,
        baseFee,
        maxFeePerGas,
        maxPriorityFeePerGas,
    });

    const receipt = await web3.eth.sendSignedTransaction(sig.rawTransaction);

    if (receipt.transactionHash) {
        tx.transactionHash = receipt.transactionHash;
        tx.state = TransactionState.Mined;
        tx = await tx.save();

        // Update lastTransactionAt value for the pool if the address is a pool
        if (await AssetPoolService.getByAddress(tx.to)) {
            await AssetPool.findOneAndUpdate({ address: tx.to }, { lastTransactionAt: Date.now() });
        }
    }

    return { tx, receipt };
}

async function deploy(abi: any, bytecode: any, arg: any[], npid: NetworkProvider) {
    const { web3, admin } = getProvider(npid);
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
    const nonce = await web3.eth.getTransactionCount(admin.address, 'pending');
    const feeData = await getEstimatesFromOracle(npid);
    const baseFee = Number(feeData.baseFee);
    const maxFeePerGas = parseFee(feeData.maxFeePerGas, npid);
    const maxPriorityFeePerGas = parseFee(feeData.maxPriorityFeePerGas, npid);
    const maxFeePerGasLimit = Number(toWei(MAX_FEE_PER_GAS, 'gwei'));

    // This comparison is in gwei
    if (maxFeePerGas > maxFeePerGasLimit) {
        throw new MaxFeePerGasExceededError();
    }

    const sig = await web3.eth.accounts.signTransaction(
        {
            gas,
            maxPriorityFeePerGas,
            data,
            nonce,
        },
        PRIVATE_KEY,
    );

    const tx = await Transaction.create({
        type: TransactionType.Default,
        state: TransactionState.Scheduled,
        network: npid,
        from: admin.address,
        gas,
        nonce,
        baseFee,
        maxFeePerGas,
        maxPriorityFeePerGas,
    });

    const receipt = await web3.eth.sendSignedTransaction(sig.rawTransaction);

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

async function call(fn: any, npid: NetworkProvider) {
    const { admin } = getProvider(npid);

    return await fn.call({
        from: admin.address,
    });
}

async function findByQuery(poolAddress:string, page = 1, limit = 10, startDate?:Date, endDate?:Date) {
    let query;
    if(startDate && !endDate) {
        query = {from: poolAddress, createdAt: {$gte: startDate}};
    } 
    else if(startDate && endDate) {
        query = {from: poolAddress, createdAt: {$gte: startDate, $lt: endDate}};
    }
    else if(!startDate && endDate) {
        query = {from: poolAddress, createdAt: {$lt: endDate}};
    } else {
        query = {from: poolAddress};
    }
    return paginatedResults(Transaction, page, limit, query);
}

export default { relay, getById, send, call, deploy, sendValue, findByQuery };
