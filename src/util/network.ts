import newrelic from 'newrelic';
import { TESTNET_RPC, RPC } from '@/config/secrets';
import Web3 from 'web3';
import axios from 'axios';
import BN from 'bn.js';
import { Contract } from 'web3-eth-contract';
import { Artifacts } from '../config/contracts/artifacts';
import { assetPoolFactoryAddress, currentVersion, poolFacetContracts } from '@/config/contracts';
import { NetworkProvider } from '../types/enums';
import TransactionService from '@/services/TransactionService';
import { THXError } from './errors';
import { keccak256, toUtf8Bytes } from 'ethers/lib/utils';
import { FacetCutAction } from './upgrades';

export class MaxFeePerGasExceededError extends THXError {
    message = 'MaxFeePerGas from oracle exceeds configured cap';
}
export class NoFeeDataError extends THXError {
    message = 'Could not get fee data from oracle';
}

export const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';

const testnet = new Web3(TESTNET_RPC);
const testnetAdmin = testnet.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY);
testnet.eth.defaultAccount = testnetAdmin.address;

const mainnet = new Web3(RPC);
const mainnetAdmin = mainnet.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY);
mainnet.eth.defaultAccount = mainnetAdmin.address;

export const getProvider = (npid: NetworkProvider) => {
    switch (npid) {
        default:
        case NetworkProvider.Test:
            return { web3: testnet, admin: testnetAdmin };
        case NetworkProvider.Main:
            return { web3: mainnet, admin: mainnetAdmin };
    }
};

// Type: safeLow, standard, fast
export async function getEstimatesFromOracle(npid: NetworkProvider, type = 'fast') {
    const url =
        npid === NetworkProvider.Main
            ? 'https://gasstation-mainnet.matic.network/v2'
            : 'https://gasstation-mumbai.matic.today/v2';
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
    for (const key of Object.keys(contract.methods)) {
        signatures.push(keccak256(toUtf8Bytes(key)).substr(0, 10));
    }
    return signatures;
}

export const getAssetPoolFactory = (npid: NetworkProvider): Contract => {
    const { web3 } = getProvider(npid);
    return new web3.eth.Contract(Artifacts.IDefaultFactory.abi as any, assetPoolFactoryAddress(npid));
};

export async function deployUnlimitedSupplyERC20Contract(
    npid: NetworkProvider,
    name: string,
    symbol: string,
    to: string,
) {
    return await TransactionService.deploy(
        Artifacts.ERC20UnlimitedSupply.abi,
        Artifacts.ERC20UnlimitedSupply.bytecode,
        [name, symbol, to],
        npid,
    );
}

export async function deployLimitedSupplyERC20Contract(
    npid: NetworkProvider,
    name: string,
    symbol: string,
    to: string,
    totalSupply: BN,
) {
    return await TransactionService.deploy(
        Artifacts.ERC20LimitedSupply.abi,
        Artifacts.ERC20LimitedSupply.bytecode,
        [name, symbol, to, totalSupply],
        npid,
    );
}

export const solutionContract = (npid: NetworkProvider, address: string): Contract => {
    const { web3 } = getProvider(npid);
    return new web3.eth.Contract(Artifacts.IDefaultDiamond.abi as any, address);
};

export const tokenContract = (npid: NetworkProvider, address: string): Contract => {
    const { web3 } = getProvider(npid);
    return new web3.eth.Contract(Artifacts.ERC20.abi as any, address);
};
