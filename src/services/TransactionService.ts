import { toWei } from 'web3-utils';

import { Transaction, TransactionState } from '@/models/Transaction';
import { getEstimatesFromOracle, getProvider, MaxFeePerGasExceededError, NetworkProvider } from '@/util/network';
import { MAX_FEE_PER_GAS, MINIMUM_GAS_LIMIT, PRIVATE_KEY } from '@/config/secrets';
import { logger } from '@/util/logger';

export class TransactionService {
    static async send(to: string, fn: any, npid: NetworkProvider, gasLimit?: number) {
        const { web3, admin } = getProvider(npid);
        const from = admin.address;
        const data = fn.encodeABI();
        const estimate = await fn.estimateGas({ from: admin.address });
        // MINIMUM_GAS_LIMIT is set for tx that have a lower estimate than allowed by the network
        const gas = gasLimit ? gasLimit : estimate < MINIMUM_GAS_LIMIT ? MINIMUM_GAS_LIMIT : estimate;
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
                to,
                from,
                maxPriorityFeePerGas,
                data,
                nonce,
            },
            PRIVATE_KEY,
        );
        const receipt = await web3.eth.sendSignedTransaction(sig.rawTransaction);

        await Transaction.create({
            id: receipt.transactionHash,
            from,
            to,
            transactionHash: receipt.transactionHash,
            gas,
            baseFee: Number(feeData.baseFee).toFixed(12),
            maxFeeForGas: Number(feeData.maxFeePerGas).toFixed(12),
            maxPriorityFeeForGas: Number(feeData.maxPriorityFeePerGas).toFixed(12),
            state: TransactionState.Pending,
        });

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
    static async deploy(abi: any, bytecode: any, arg: any[], npid: NetworkProvider) {
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
        const receipt = await web3.eth.sendSignedTransaction(sig.rawTransaction);

        await Transaction.create({
            id: receipt.transactionHash,
            from: receipt.from,
            to: receipt.to,
            transactionHash: receipt.transactionHash,
            gas,
            baseFee: Number(feeData.baseFee).toFixed(12),
            maxFeeForGas: Number(feeData.maxFeePerGas).toFixed(12),
            maxPriorityFeeForGas: Number(feeData.maxPriorityFeePerGas).toFixed(12),
            state: TransactionState.Pending,
        });

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
    static async call(fn: any, npid: NetworkProvider) {
        const { admin } = getProvider(npid);

        return await fn.call({
            from: admin.address,
        });
    }
}
