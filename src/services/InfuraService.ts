import { NetworkProvider, TransactionState, TransactionType } from '@/types/enums';
import { BigNumber, Contract, ethers, Signer } from 'ethers';
import { parseUnits } from 'ethers/lib/utils';
import { INFURA_GAS_TANK, INFURA_PROJECT_ID, PRIVATE_KEY, TESTNET_INFURA_GAS_TANK } from '@/config/secrets';
import { Artifacts } from '@/config/contracts/artifacts';
import { soliditySha3 } from 'web3-utils';
import { Transaction, TransactionDocument } from '@/models/Transaction';
import { AssetPoolType } from '@/models/AssetPool';
import { poll } from '@/util/polling';

const testnet = new ethers.providers.InfuraProvider('maticmum', INFURA_PROJECT_ID);
const mainnet = new ethers.providers.InfuraProvider('matic', INFURA_PROJECT_ID);
const testnetAdmin = new ethers.Wallet(PRIVATE_KEY, testnet);
const mainnetAdmin = new ethers.Wallet(PRIVATE_KEY, mainnet);

function getProvider(npid: NetworkProvider) {
    switch (npid) {
        default:
        case NetworkProvider.Test:
            return { provider: testnet, admin: testnetAdmin };
        case NetworkProvider.Main:
            return { provider: mainnet, admin: mainnetAdmin };
    }
}

function getGasTank(npid: NetworkProvider) {
    switch (npid) {
        default:
        case NetworkProvider.Test:
            return TESTNET_INFURA_GAS_TANK;
        case NetworkProvider.Main:
            return INFURA_GAS_TANK;
    }
}

async function deposit(value: BigNumber, npid: NetworkProvider) {
    const { admin } = getProvider(npid);
    const to = getGasTank(npid);
    const nonce = await admin.getTransactionCount('pending');
    const gasLimit = await admin.estimateGas({
        to,
        value,
        nonce,
        from: await admin.getAddress(),
    });
    const tx = await admin.sendTransaction({
        to,
        gasLimit,
        value,
        from: await admin.getAddress(),
        maxFeePerGas: parseUnits('50', 'gwei'),
        maxPriorityFeePerGas: parseUnits('35', 'gwei'),
    });
    return await tx.wait();
}

async function getAdminBalance(npid: NetworkProvider) {
    const { provider, admin } = getProvider(npid);
    const gasTank = await provider.send('relay_getBalance', [await admin.getAddress()]);
    return gasTank.balance;
}

async function signRequest(tx: any, signer: Signer) {
    const chainId = await signer.getChainId();
    const relayTransactionHash = ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(
            ['address', 'bytes', 'uint', 'uint', 'string'],
            [tx.to, tx.data, tx.gas, chainId, tx.schedule],
        ),
    );
    return await signer.signMessage(ethers.utils.arrayify(relayTransactionHash));
}

async function getCallData(solution: Contract, fn: string, args: any[], account: Signer) {
    const nonce = Number(await solution.getLatestNonce(await account.getAddress())) + 1;
    const call = solution.interface.encodeFunctionData(fn, args);
    const hash = soliditySha3(call, nonce);
    const sig = await account.signMessage(ethers.utils.arrayify(hash));

    return { call, nonce, sig };
}

async function schedule(to: string, fn: string, args: any[], npid: NetworkProvider) {
    const { admin } = getProvider(npid);
    const solution = new ethers.Contract(to, Artifacts.IDefaultDiamond.abi, admin);
    // Get the relayed call data, nonce and signature for this contract call
    const calldata = await getCallData(solution, fn, args, admin);

    return await Transaction.create({
        state: TransactionState.Pending,
        type: TransactionType.ITX,
        to,
        network: npid,
        calldata,
    });
}

async function send(tx: TransactionDocument) {
    const { provider, admin } = getProvider(tx.network);
    const solution = new ethers.Contract(tx.to, Artifacts.IDefaultDiamond.abi, admin);
    const { call, nonce, sig } = tx.calldata;
    // Encode a relay call with the relayed call data
    const data = solution.interface.encodeFunctionData('call', [call, nonce, sig]);
    // Sign the req with the ITX gas tank admin
    const options = {
        to: tx.to,
        data,
        // Hardcode value since relayed calls are not estimated correctly
        gas: '500000',
        schedule: 'fast',
    };
    const signature = await signRequest(tx, admin);

    // Send transaction data and receive relayTransactionHash to poll
    const { relayTransactionHash } = await provider.send('relay_sendTransaction', [options, signature]);

    return await tx.updateOne({ relayTransactionHash });
}

async function getTransactionStatus(assetPool: AssetPoolType, tx: TransactionDocument) {
    const { provider } = getProvider(assetPool.network);
    const { broadcasts } = await provider.send('relay_getTransactionStatus', [tx.relayTransactionHash]);

    if (!broadcasts) return;

    // Check each of these hashes to see if their receipt exists and has confirmations
    for (const broadcast of broadcasts) {
        const { ethTxHash, gasPrice } = broadcast;
        const receipt = await provider.getTransactionReceipt(ethTxHash);

        // Check if block tx is mined and confirmed at least twice
        if (receipt && receipt.confirmations && receipt.confirmations > 1) {
            await tx.updateOne({
                maxPriorityFeePerGas: gasPrice,
                transactionHash: receipt.transactionHash,
                state: TransactionState.Mined,
            });
            return receipt;
        }
    }
}

async function pollTransactionStatus(assetPool: AssetPoolType, tx: TransactionDocument) {
    const fn = () => getTransactionStatus(assetPool, tx);
    const fnCondition = (result: string) => typeof result === undefined;

    // Waiting for the corresponding Polygon transaction to be mined
    // We poll the relay_getTransactionStatus method for status updates
    // ITX bumps the gas price of your transaction until it's mined,
    // causing a new transaction hash to be created each time it happens.
    // relay_getTransactionStatus returns a list of these transaction hashes
    // which can then be used to poll Infura for their transaction receipts
    return await poll(fn, fnCondition, 500);
}

async function pending(npid: NetworkProvider) {
    return Transaction.find({
        type: TransactionType.ITX,
        state: TransactionState.Pending,
        transactionHash: { $exists: false },
        network: npid,
    });
}

export default {
    getGasTank,
    deposit,
    getAdminBalance,
    schedule,
    send,
    getTransactionStatus,
    pollTransactionStatus,
    pending,
};
