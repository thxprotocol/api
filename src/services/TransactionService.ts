import { toWei } from 'web3-utils';
import { Transaction } from '@/models/Transaction';
import { getEstimatesFromOracle, getProvider, MaxFeePerGasExceededError } from '@/util/network';
import { NetworkProvider, TransactionState, TransactionType } from '@/types/enums';
import { MAX_FEE_PER_GAS, MINIMUM_GAS_LIMIT, PRIVATE_KEY } from '@/config/secrets';

function getById(id: string) {
    return Transaction.findById(id);
}

function parseFee(value: number, npid: NetworkProvider) {
    return Number(toWei(String(Math.ceil(value + (npid === NetworkProvider.Test ? 30 : 0))), 'gwei'));
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
    let tx = await Transaction.create({
        type: TransactionType.Default,
        state: TransactionState.Pending,
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
        state: TransactionState.Pending,
        type: TransactionType.Default,
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

export default { getById, send, call, deploy };
