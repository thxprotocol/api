import newrelic from 'newrelic';
import { TESTNET_RPC, RPC, MAINNET_NETWORK_NAME } from '@/config/secrets';
import Web3 from 'web3';
import axios from 'axios';
import BN from 'bn.js';
import { Contract } from 'web3-eth-contract';
import { NetworkProvider } from '../types/enums';
import TransactionService from '@/services/TransactionService';
import { THXError } from './errors';
import { AbiItem } from 'web3-utils';
import { getContract, getContractConfig } from '@/config/contracts';
import { assertEvent, parseLogs } from './events';

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
    for (const sig of Object.keys(contract.methods)) {
        if (sig.indexOf('(') === -1) continue; // Only add selectors for full function signatures.
        signatures.push(testnet.eth.abi.encodeFunctionSignature(sig));
    }
    return signatures;
}

export async function deployUnlimitedSupplyERC20Contract(
    npid: NetworkProvider,
    name: string,
    symbol: string,
    to: string,
) {
    const tokenFactory = getContract(npid, 'TokenFactory');
    const { receipt } = await TransactionService.send(
        tokenFactory.options.address,
        tokenFactory.methods.deployUnlimitedSupplyToken(name, symbol, to),
        npid,
    );

    const event = assertEvent('TokenDeployed', parseLogs(tokenFactory.options.jsonInterface, receipt.logs));

    return tokenContract(npid, event.args.token);
}

export async function deployLimitedSupplyERC20Contract(
    npid: NetworkProvider,
    name: string,
    symbol: string,
    to: string,
    totalSupply: BN,
) {
    const tokenFactory = getContract(npid, 'TokenFactory');
    const { receipt } = await TransactionService.send(
        tokenFactory.options.address,
        tokenFactory.methods.deployLimitedSupplyToken(name, symbol, to, totalSupply),
        npid,
    );

    const event = assertEvent('TokenDeployed', parseLogs(tokenFactory.options.jsonInterface, receipt.logs));

    return tokenContract(npid, event.args.token);
}

export const tokenContract = (npid: NetworkProvider, address: string): Contract => {
    // Temporary fix for issue in artifacts package where tests run against LimitedSupplyToken and other releases at TokenLimitedSupply
    const contractName = MAINNET_NETWORK_NAME === 'hardhat' ? 'LimitedSupplyToken' : ('TokenLimitedSupply' as any);
    return getContractFromAbi(npid, getContractConfig(npid, contractName).abi, address);
};

export const getContractFromAbi = (npid: NetworkProvider, abi: AbiItem[], address: string): Contract => {
    const { web3 } = getProvider(npid);
    return new web3.eth.Contract(abi, address);
};
