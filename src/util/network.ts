import newrelic from 'newrelic';
import { PRIVATE_KEY, TESTNET_RPC, RPC, MAX_FEE_PER_GAS } from '@/config/secrets';
import Web3 from 'web3';
import axios from 'axios';
import BN from 'bn.js';
import { toWei } from 'web3-utils';
import { utils } from 'ethers/lib';
import { Contract } from 'web3-eth-contract';
import { Artifacts } from '../config/contracts/artifacts';
import { logger } from './logger';
import { THXError } from './errors';
import { assetPoolFactoryAddress } from '@/config/contracts';
import { NetworkProvider } from '../types/enums';

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

export async function deployContract(abi: any, bytecode: any, arg: any[], npid: NetworkProvider): Promise<Contract> {
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

// TODO This is redundant since defaultAccount is set and from not needed
// Should be re-introduced when a gas admin per pool is available.
// export async function callFunction(fn: any, npid: NetworkProvider) {
//     const { admin } = getProvider(npid);

//     return await fn.call({
//         from: admin.address,
//     });
// }

// // gasLimit is set for methods that have incorrect default gas estimates, resulting in tx running out of gas
// export async function sendTransaction(to: string, fn: any, npid: NetworkProvider, gasLimit?: number) {
//     const { web3, admin } = getProvider(npid);
//     const from = admin.address;
//     const data = fn.encodeABI();
//     const estimate = await fn.estimateGas({ from: admin.address });
//     // MINIMUM_GAS_LIMIT is set for tx that have a lower estimate than allowed by the network
//     const gas = gasLimit ? gasLimit : estimate < MINIMUM_GAS_LIMIT ? MINIMUM_GAS_LIMIT : estimate;
//     const nonce = await web3.eth.getTransactionCount(admin.address, 'pending');
//     const feeData = await getEstimatesFromOracle(npid);
//     const maxFeePerGasLimit = Number(toWei(MAX_FEE_PER_GAS, 'gwei'));
//     const maxFeePerGas = Number(toWei(String(Math.ceil(feeData.maxFeePerGas)), 'gwei'));
//     const maxPriorityFeePerGas = Number(toWei(String(Math.ceil(feeData.maxPriorityFeePerGas)), 'gwei'));

//     // This comparison is in gwei
//     if (maxFeePerGas > maxFeePerGasLimit) {
//         throw new MaxFeePerGasExceededError();
//     }

//     const sig = await web3.eth.accounts.signTransaction(
//         {
//             gas,
//             to,
//             from,
//             maxPriorityFeePerGas,
//             data,
//             nonce,
//         },
//         PRIVATE_KEY,
//     );
//     const receipt = await web3.eth.sendSignedTransaction(sig.rawTransaction);

//     logger.info({
//         fn: fn.name,
//         to,
//         feeData,
//         receipt: {
//             transactionHash: receipt.transactionHash,
//             gasUsed: receipt.gasUsed,
//             effectiveGasPrice: receipt.effectiveGasPrice,
//             gasCosts: receipt.gasUsed * receipt.effectiveGasPrice,
//         },
//         network: npid,
//     });

//     return receipt;
// }

export function getSelectors(contract: Contract) {
    const signatures = [];
    for (const key of Object.keys(contract.methods)) {
        signatures.push(utils.keccak256(utils.toUtf8Bytes(key)).substr(0, 10));
    }
    return signatures;
}

export const getAssetPoolFactory = (npid: NetworkProvider): Contract => {
    const { web3 } = getProvider(npid);
    return new web3.eth.Contract(Artifacts.IAssetPoolFactory.abi as any, assetPoolFactoryAddress(npid));
};

export async function deployUnlimitedSupplyERC20Contract(
    npid: NetworkProvider,
    name: string,
    symbol: string,
    to: string,
) {
    return await deployContract(
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
    return await deployContract(
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
