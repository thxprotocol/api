import { NetworkProvider, TransactionType } from '@/types/enums';
import { Contract, ethers, Signer } from 'ethers';
import { parseUnits } from 'ethers/lib/utils';
import { INFURA_GAS_TANK, INFURA_PROJECT_ID, PRIVATE_KEY } from '@/config/secrets';
import { Artifacts } from '@/config/contracts/artifacts';
import { soliditySha3 } from 'web3-utils';
import { Transaction } from '@/models/Transaction';

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

async function deposit(npid: NetworkProvider) {
    const { admin } = getProvider(npid);
    const to = INFURA_GAS_TANK;
    const value = parseUnits('0.1', 'ether');
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
    // TODO improve local nonce by fetching from Transaction collection for highest nonce +1
    const nonce1 = (await admin.getTransactionCount('pending')) + 1;
    console.log(nonce, nonce1);
    // Encode a relay call witht he relayed call data
    const data = solution.interface.encodeFunctionData('call', [call, nonce, sig]);
    // Estimate gas for the relayed ITX call
    const gas = String(
        await admin.estimateGas({
            to,
            data,
        }),
    );
    // Sign the tx with the ITX gas tank admin
    const tx = {
        to,
        data,
        gas,
        schedule: 'fast',
    };
    const signature = await signRequest(tx, admin);
    // Send transaction data and receive relayTransactionHash to poll
    const { relayTransactionHash } = await provider.send('relay_sendTransaction', [tx, signature]);

    await Transaction.create({
        type: TransactionType.ITX,
        to,
        gas,
        nonce,
        relayTransactionHash,
    });

    return relayTransactionHash;
}

const wait = (milliseconds: number) => {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
};

async function waitTransaction(relayTransactionHash: string, npid: NetworkProvider) {
    const { provider } = getProvider(npid);
    // eslint-disable-next-line no-constant-condition
    while (true) {
        // { receivedTime: string, broadcasts?: [{broadcastTime: string, ethTxHash: string, gasPrice: string}]}
        const { broadcasts } = await provider.send('relay_getTransactionStatus', [relayTransactionHash]);

        // Check each of these hashes to see if their receipt exists and has confirmations
        if (broadcasts) {
            for (const broadcast of broadcasts) {
                const { broadcastTime, ethTxHash, gasPrice } = broadcast;
                const receipt = await provider.getTransactionReceipt(ethTxHash);
                console.log({ broadcastTime, ethTxHash, gasPrice });

                // Check if block tx is mined and confirmed at least twice
                if (receipt && receipt.confirmations && receipt.confirmations > 1) {
                    console.log(`Ethereum transaction hash: ${receipt.transactionHash}`);
                    console.log(`Mined in block ${receipt.blockNumber}`);
                    return receipt;
                }
            }
        }
        await wait(1000);
    }
}

export default { getAdminBalance, send, deposit, waitTransaction };
