import { NetworkProvider, TransactionState } from '@/types/enums';
import { BigNumber, Contract, ethers, Signer } from 'ethers';
import { parseUnits } from 'ethers/lib/utils';
import { INFURA_GAS_TANK, INFURA_PROJECT_ID, PRIVATE_KEY, TESTNET_INFURA_GAS_TANK } from '@/config/secrets';
import { Artifacts } from '@/config/contracts/artifacts';
import { soliditySha3 } from 'web3-utils';
import { Transaction, TransactionDocument } from '@/models/Transaction';
import { AssetPoolType } from '@/models/AssetPool';
import { fromWei } from 'web3-utils';

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
        maxPriorityFeePerGas: parseUnits('30', 'gwei'),
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

async function send(to: string, fn: string, args: any[], npid: NetworkProvider) {
    const { provider, admin } = getProvider(npid);
    const solution = new ethers.Contract(to, Artifacts.IDefaultDiamond.abi, admin);
    // Get the relayed call data, nonce and signature for this contract call
    const { call, nonce, sig } = await getCallData(solution, fn, args, admin);
    // Encode a relay call witht he relayed call data
    const data = solution.interface.encodeFunctionData('call', [call, nonce, sig]);
    // Estimate gas for the relayed ITX call
    const gas = String(
        await admin.estimateGas({
            to,
            data,
        }),
    );
    // Sign the req with the ITX gas tank admin
    const tx = {
        to,
        data,
        gas: '250000',
        schedule: 'fast',
    };
    const signature = await signRequest(tx, admin);

    // Check gas tank balance and top up if required
    // const balance = Number(fromWei(await getAdminBalance(npid)));
    // if (balance < 1) {
    //     await deposit(parseUnits('5', 'ether'), npid);
    // }

    // Send transaction data and receive relayTransactionHash to poll
    const { relayTransactionHash } = await provider.send('relay_sendTransaction', [tx, signature]);

    return await Transaction.create({
        to,
        gas,
        nonce,
        relayTransactionHash,
    });
}

async function getTransactionStatus(assetPool: AssetPoolType, tx: TransactionDocument) {
    const { provider } = getProvider(assetPool.network);
    const { broadcasts } = await provider.send('relay_getTransactionStatus', [tx.relayTransactionHash]);

    if (!broadcasts) return;

    // Check each of these hashes to see if their receipt exists and has confirmations
    for (const broadcast of broadcasts) {
        const { broadcastTime, ethTxHash, gasPrice } = broadcast;
        const receipt = await provider.getTransactionReceipt(ethTxHash);
        console.log({ broadcastTime, ethTxHash, gasPrice });

        // Check if block tx is mined and confirmed at least twice
        if (receipt && receipt.confirmations && receipt.confirmations > 1) {
            await tx.updateOne({ transactionHash: receipt.transactionHash, state: TransactionState.Mined });
            return receipt;
        }
    }
}

async function pending() {
    return Transaction.find({
        relayTransactionHash: { $exists: true },
        transactionHash: { $exists: false },
    });
}

export default { getGasTank, getAdminBalance, send, getTransactionStatus, pending };
