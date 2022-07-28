import newrelic from 'newrelic';
import { HARDHAT_RPC, POLYGON_MUMBAI_RPC, POLYGON_RPC } from '@/config/secrets';
import Web3 from 'web3';
import axios from 'axios';
import { Contract } from 'web3-eth-contract';
import { ChainId } from '../types/enums';
import { THXError } from './errors';
import { soliditySha3 } from 'web3-utils';
import { arrayify, computeAddress, hashMessage, recoverPublicKey } from 'ethers/lib/utils';

export class MaxFeePerGasExceededError extends THXError {
    message = 'MaxFeePerGas from oracle exceeds configured cap';
}
export class NoFeeDataError extends THXError {
    message = 'Could not get fee data from oracle';
}

export const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';

const hardhat = new Web3(HARDHAT_RPC);
const hardhatAdmin = hardhat.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY);
hardhat.eth.defaultAccount = hardhatAdmin.address;

const testnet = new Web3(POLYGON_MUMBAI_RPC);
const testnetAdmin = testnet.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY);
testnet.eth.defaultAccount = testnetAdmin.address;

const mainnet = new Web3(POLYGON_RPC);
const mainnetAdmin = mainnet.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY);
mainnet.eth.defaultAccount = mainnetAdmin.address;

export const recoverSigner = (message: string, sig: string) => {
    return computeAddress(recoverPublicKey(arrayify(hashMessage(message)), sig));
};

export const recoverAddress = (call: string, nonce: number, sig: string) => {
    const hash = soliditySha3(call, nonce);
    const pubKey = recoverPublicKey(arrayify(hashMessage(arrayify(hash))), sig);

    return computeAddress(pubKey);
};

export const getProvider = (chainId: ChainId) => {
    switch (chainId) {
        default:
        case ChainId.Hardhat:
            return { web3: hardhat, admin: hardhatAdmin };
        case ChainId.PolygonMumbai:
            return { web3: testnet, admin: testnetAdmin };
        case ChainId.Polygon:
            return { web3: mainnet, admin: mainnetAdmin };
    }
};

// Type: safeLow, standard, fast
export async function getEstimatesFromOracle(chainId: ChainId, type = 'fast') {
    let url = 'https://gasstation-mumbai.matic.today/v2';

    if (chainId === ChainId.Polygon) url = 'https://gasstation-mainnet.matic.network/v2';

    const r = await axios.get(url);

    if (r.status !== 200) {
        throw new NoFeeDataError();
    }

    const estimatedBaseFee = r.data.estimatedBaseFee;
    const blockTime = r.data.blockTime;
    const blockNumber = r.data.blockNumber;

    newrelic.recordMetric('Network/Gas/BaseFee', Number(estimatedBaseFee));
    newrelic.recordMetric('Network/Gas/MaxPriorityFee', Number(r.data[type].maxPriorityFee));
    newrelic.recordMetric('Network/Gas/MaxFeePerGas', Number(r.data[type].maxFee));

    return {
        baseFee: Number(estimatedBaseFee).toFixed(12),
        maxPriorityFeePerGas: r.data[type].maxPriorityFee,
        maxFeePerGas: r.data[type].maxFee,
        blockTime,
        blockNumber,
    };
}

export function getSelectors(contract: Contract) {
    const signatures = [];
    for (const sig of Object.keys(contract.methods)) {
        if (sig.indexOf('(') === -1) continue; // Only add selectors for full function signatures.
        signatures.push(testnet.eth.abi.encodeFunctionSignature(sig));
    }
    return signatures;
}
