import { NetworkProvider } from '@/util/network';
import { ethers, Signer } from 'ethers';
import { INFURA_GAS_TANK, INFURA_PROJECT_ID, PRIVATE_KEY } from '@/util/secrets';
import { parseUnits } from 'ethers/lib/utils';

const testnet = new ethers.providers.InfuraProvider('mumbai-mainnet', INFURA_PROJECT_ID);
const mainnet = new ethers.providers.InfuraProvider('polygon-mainnet', INFURA_PROJECT_ID);
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

async function deposit(signer: Signer) {
    const tx = await signer.sendTransaction({
        to: INFURA_GAS_TANK,
        value: parseUnits('1', 'ether'),
    });
    await tx.wait();
}

async function getAdminBalance(npid: NetworkProvider) {
    const { provider, admin } = getProvider(npid);
    return await provider.send('relay_getBalance', [admin.address]);
}

async function signRequest(tx: any, signer: Signer) {
    const relayTransactionHash = ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(
            ['address', 'bytes', 'uint', 'uint', 'string'],
            [tx.to, tx.data, tx.gas, 4, tx.schedule], // Rinkeby chainId is 4
        ),
    );
    return await signer.signMessage(ethers.utils.arrayify(relayTransactionHash));
}

async function send(npid: NetworkProvider) {
    const { provider, admin } = getProvider(npid);
    const iface = new ethers.utils.Interface(['function echo(string message)']);
    const data = iface.encodeFunctionData('echo', ['Hello world!']);
    const tx = {
        to: '0x6663184b3521bF1896Ba6e1E776AB94c317204B6',
        data: data,
        gas: '100000',
        schedule: 'fast',
    };
    const signature = await signRequest(tx, admin);
    const relayTransactionHash = await provider.send('relay_sendTransaction', [tx, signature]);

    console.log(`ITX relay hash: ${relayTransactionHash}`);

    return relayTransactionHash;
}

export default { getAdminBalance, send, deposit };
