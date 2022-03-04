import { NetworkProvider } from '@/types/enums';
import { Contract, ethers, Signer } from 'ethers';
import { parseUnits } from 'ethers/lib/utils';
import { INFURA_GAS_TANK, INFURA_PROJECT_ID, PRIVATE_KEY } from '@/config/secrets';
import { Artifacts } from '@/util/artifacts';
import { soliditySha3 } from 'web3-utils';
import { logger } from '@/util/logger';

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
    const nonce = Number(await solution.getLatestNonce(account.getAddress())) + 1;
    const call = solution.interface.encodeFunctionData(fn, args);
    const hash = soliditySha3(call, nonce);
    const sig = await account.signMessage(ethers.utils.arrayify(hash));

    return { call, nonce, sig };
}

let sentAtBlock = 0;

async function send(to: string, fn: string, args: any[], npid: NetworkProvider) {
    const { provider, admin } = getProvider(npid);
    const solution = new ethers.Contract(to, Artifacts.IDefaultDiamond.abi, admin);
    const { call, nonce, sig } = await getCallData(solution, fn, args, admin);
    const data = solution.interface.encodeFunctionData('call', [call, nonce, sig]);
    const gas = String(
        await admin.estimateGas({
            to,
            data,
        }),
    );
    const tx = {
        to,
        data,
        gas,
        schedule: 'fast',
    };
    const signature = await signRequest(tx, admin);

    // Relay the transaction through ITX
    sentAtBlock = await provider.getBlockNumber(); // Stats

    return await provider.send('relay_sendTransaction', [tx, signature]);
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
                    console.log(`Sent at block ${sentAtBlock}`);
                    console.log(`Mined in block ${receipt.blockNumber}`);
                    console.log(`Total blocks ${receipt.blockNumber - sentAtBlock}`);
                    return receipt;
                }
            }
        }
        await wait(1000);
    }
}

export default { getAdminBalance, send, deposit, waitTransaction };
