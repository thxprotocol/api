import { toWei } from 'web3-utils';

import { Transaction } from '@/models/Transaction';
import { getEstimatesFromOracle, getProvider, MaxFeePerGasExceededError } from '@/util/network';
import { NetworkProvider, TransactionState, TransactionType } from '@/types/enums';
import { MAX_FEE_PER_GAS, MINIMUM_GAS_LIMIT, PRIVATE_KEY } from '@/config/secrets';
import { logger } from '@/util/logger';

async function send(to: string, fn: any, npid: NetworkProvider, gasLimit?: number, fromPK?: string) {
    const { web3, admin } = getProvider(npid);
    const from = fromPK ? web3.eth.accounts.privateKeyToAccount(fromPK).address : admin.address;
    const data = fn.encodeABI();
    const estimate = await fn.estimateGas({ from });
    // MINIMUM_GAS_LIMIT is set for tx that have a lower estimate than allowed by the network
    const gas = gasLimit ? gasLimit : estimate < MINIMUM_GAS_LIMIT ? MINIMUM_GAS_LIMIT : estimate;
    const nonce = await web3.eth.getTransactionCount(from, 'pending');
    const feeData = await getEstimatesFromOracle(npid);
    const maxFeePerGasLimit = Number(toWei(MAX_FEE_PER_GAS, 'gwei'));
    const maxFeePerGas = Number(toWei(String(Math.ceil(feeData.maxFeePerGas)), 'gwei'));
    const maxPriorityFeePerGas = Number(toWei(String(Math.ceil(feeData.maxPriorityFeePerGas)), 'gwei'));

    // This comparison is in gwei
    if (maxFeePerGas > maxFeePerGasLimit) {
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
    const tx = await Transaction.create({
        from,
        to,
        gas,
        type: TransactionType.Default,
        state: TransactionState.Pending,
        baseFee: Number(feeData.baseFee).toFixed(12),
        maxFeeForGas: Number(feeData.maxFeePerGas).toFixed(12),
        maxPriorityFeeForGas: Number(feeData.maxPriorityFeePerGas).toFixed(12),
    });

    const receipt = await web3.eth.sendSignedTransaction(sig.rawTransaction);

    // Update the transactionHash when known. Retry jobs will query for tx with missing txHashes
    await tx.update({ transactionHash: receipt.transactionHash });

    logger.info({
        fn: fn.name,
        to,
        feeData,
        receipt: {
            transactionHash: receipt.transactionHash,
            gasUsed: receipt.gasUsed,
            effectiveGasPrice: receipt.effectiveGasPrice,
            gasCosts: receipt.gasUsed * receipt.effectiveGasPrice,
        },
        network: npid,
    });

    return receipt;
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
    const maxFeePerGasLimit = Number(toWei(MAX_FEE_PER_GAS, 'gwei'));
    const maxFeePerGas = Number(toWei(String(Math.ceil(feeData.maxFeePerGas)), 'gwei'));
    const maxPriorityFeePerGas = Number(toWei(String(Math.ceil(feeData.maxPriorityFeePerGas)), 'gwei'));

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
        gas,
        baseFee: Number(feeData.baseFee).toFixed(12),
        maxFeeForGas: Number(feeData.maxFeePerGas).toFixed(12),
        maxPriorityFeeForGas: Number(feeData.maxPriorityFeePerGas).toFixed(12),
        state: TransactionState.Pending,
        type: TransactionType.Default,
    });

    const receipt = await web3.eth.sendSignedTransaction(sig.rawTransaction);

    if (receipt.transactionHash) {
        await tx.update({
            from: receipt.from,
            to: receipt.to,
            transactionHash: receipt.transactionHash,
            state: TransactionState.Mined,
        });
    }

    logger.info({
        to: receipt.contractAddress,
        feeData,
        receipt: {
            transactionHash: receipt.transactionHash,
            gasUsed: receipt.gasUsed,
            effectiveGasPrice: receipt.effectiveGasPrice,
            gasCosts: receipt.gasUsed * receipt.effectiveGasPrice,
        },
        network: npid,
    });

    contract.options.address = receipt.contractAddress;

    return contract;
}

async function call(fn: any, npid: NetworkProvider) {
    const { admin } = getProvider(npid);

    return await fn.call({
        from: admin.address,
    });
}

export default { send, call, deploy };
