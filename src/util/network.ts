import { NextFunction, Response } from 'express';
import {
    ENVIRONMENT,
    PRIVATE_KEY,
    TESTNET_ASSET_POOL_FACTORY_ADDRESS,
    ASSET_POOL_FACTORY_ADDRESS,
    TESTNET_RPC,
    RPC,
    FIXED_GAS_PRICE,
    MINIMUM_GAS_LIMIT,
    MAXIMUM_GAS_PRICE,
} from '../util/secrets';
import Web3 from 'web3';
import axios from 'axios';
import BN from 'bn.js';
import { isAddress } from 'web3-utils';
import { utils } from 'ethers/lib';
import { HttpError, HttpRequest } from '../models/Error';
import { AssetPool } from '../models/AssetPool';
import { Contract } from 'web3-eth-contract';
import { Artifacts } from './artifacts';
import { logger } from './logger';

export enum NetworkProvider {
    Test = 0,
    Main = 1,
}

export const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';

export const getProvider = (npid: NetworkProvider) => {
    let web3: Web3;

    switch (npid) {
        default:
        case NetworkProvider.Test:
            web3 = new Web3(TESTNET_RPC);
            break;
        case NetworkProvider.Main:
            web3 = new Web3(RPC);
            break;
    }
    const account = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY);

    web3.eth.accounts.wallet.add(account);

    return web3;
};

export async function getGasPrice(npid: NetworkProvider) {
    const web3 = getProvider(npid);

    if (FIXED_GAS_PRICE > 0) {
        return web3.utils.toWei(FIXED_GAS_PRICE.toString(), 'gwei').toString();
    }

    if (ENVIRONMENT === 'test' || ENVIRONMENT === 'local' || npid === NetworkProvider.Test) {
        return await web3.eth.getGasPrice();
    }

    const r = await axios.get('https://gpoly.blockscan.com/gasapi.ashx?apikey=key&method=gasoracle');

    if (r.status !== 200) {
        throw new Error('Gas station does not give gas price information.');
    }

    if (r.data.result.FastGasPrice > MAXIMUM_GAS_PRICE) {
        throw new Error('Gas price exceeds configured cap');
    } else {
        return web3.utils.toWei(r.data.result.FastGasPrice, 'gwei').toString();
    }
}

export const getAdmin = (npid: NetworkProvider) => {
    const web3 = getProvider(npid);
    return web3.eth.accounts.wallet.add(PRIVATE_KEY);
};

export const getBalance = (npid: NetworkProvider, address: string) => {
    const web3 = getProvider(npid);
    return web3.eth.getBalance(address);
};

export async function deployContract(abi: any, bytecode: any, arg: any[], npid: NetworkProvider): Promise<Contract> {
    const web3 = getProvider(npid);
    const contract = new web3.eth.Contract(abi, null, {
        from: getAdmin(npid).address,
    });
    const gasPrice = await getGasPrice(npid);
    const from = getAdmin(npid).address;
    const gas = await contract
        .deploy({
            data: bytecode,
            arguments: arg,
        })
        .estimateGas();

    logger.info({ to: '', fn: 'deployContract', gas, gasPrice, network: npid });
    return await contract
        .deploy({
            data: bytecode,
            arguments: arg,
        })
        .send({
            gas,
            from,
            gasPrice,
        });
}

export async function callFunction(fn: any, npid: NetworkProvider) {
    const from = getAdmin(npid).address;

    return await fn.call({
        from,
    });
}

export async function sendTransaction(to: string, fn: any, npid: NetworkProvider) {
    const web3 = getProvider(npid);
    const from = getAdmin(npid).address;
    const gasPrice = await getGasPrice(npid);

    const data = fn.encodeABI();
    const estimate = await fn.estimateGas({ from, to });
    const gas = estimate < MINIMUM_GAS_LIMIT ? MINIMUM_GAS_LIMIT : estimate;
    const sig = await web3.eth.accounts.signTransaction(
        {
            gas,
            gasPrice,
            to,
            from,
            data,
        },
        PRIVATE_KEY,
    );
    logger.info({ to, fn: fn.name, estimate, gas, gasPrice, network: npid });
    return await web3.eth.sendSignedTransaction(sig.rawTransaction);
}

export async function sendTransactionValue(to: string, value: string, npid: NetworkProvider) {
    const web3 = getProvider(npid);
    const from = getAdmin(npid).address;
    const gasPrice = await getGasPrice(npid);

    const estimate = await web3.eth.estimateGas({ from, to, value });
    const gas = estimate < MINIMUM_GAS_LIMIT ? MINIMUM_GAS_LIMIT : estimate;
    const sig = await web3.eth.accounts.signTransaction(
        {
            gas,
            gasPrice,
            to,
            from,
            value,
        },
        PRIVATE_KEY,
    );
    logger.info({ to, value, estimate, gas, gasPrice, network: npid });
    return await web3.eth.sendSignedTransaction(sig.rawTransaction);
}

export function getSelectors(contract: Contract) {
    const signatures = [];
    for (const key of Object.keys(contract.methods)) {
        signatures.push(utils.keccak256(utils.toUtf8Bytes(key)).substr(0, 10));
    }
    return signatures;
}

export const getAssetPoolFactory = (npid: NetworkProvider): Contract => {
    const admin = getAdmin(npid);
    const web3 = getProvider(npid);

    switch (npid) {
        case NetworkProvider.Test:
            return new web3.eth.Contract(Artifacts.IAssetPoolFactory.abi as any, TESTNET_ASSET_POOL_FACTORY_ADDRESS, {
                from: admin.address,
            });
        case NetworkProvider.Main:
            return new web3.eth.Contract(Artifacts.IAssetPoolFactory.abi as any, ASSET_POOL_FACTORY_ADDRESS, {
                from: admin.address,
            });
    }
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
    const web3 = getProvider(npid);
    return new web3.eth.Contract(Artifacts.IDefaultDiamond.abi as any, address, {
        from: getAdmin(npid).address,
    });
};

export const tokenContract = (npid: NetworkProvider, address: string): Contract => {
    const web3 = getProvider(npid);
    return new web3.eth.Contract(Artifacts.ERC20.abi as any, address, {
        from: getAdmin(npid).address,
    });
};

export async function parseHeader(req: HttpRequest, res: Response, next: NextFunction) {
    const address = req.header('AssetPool');

    if (address && isAddress(address)) {
        const assetPool = await AssetPool.findOne({ address });

        if (!assetPool) {
            return next(new HttpError(404, 'Asset Pool is not found in database.'));
        }

        (req as HttpRequest).solution = assetPool.solution = solutionContract(assetPool.network, address);
        (req as HttpRequest).assetPool = assetPool;
    }

    return next();
}
