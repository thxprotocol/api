import { NextFunction, Response } from 'express';
import {
    ENVIRONMENT,
    PRIVATE_KEY,
    TESTNET_ASSET_POOL_FACTORY_ADDRESS,
    ASSET_POOL_FACTORY_ADDRESS,
    TESTNET_RPC,
    RPC,
    TESTNET_RPC_WSS,
    RPC_WSS,
    MINIMUM_GAS_LIMIT,
} from '../util/secrets';
import Web3 from 'web3';
import { isAddress } from 'web3-utils';
import { HttpError, HttpRequest } from '../models/Error';
import AssetPoolFactoryArtifact from '../artifacts/contracts/contracts/AssetPoolFactory/IAssetPoolFactory.sol/IAssetPoolFactory.json';
import IDefaultDiamondArtifact from '../artifacts/contracts/contracts/IDefaultDiamond.sol/IDefaultDiamond.json';
import ERC20Artifact from '../artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json';
import ERC20LimitedSupplyArtifact from '../artifacts/contracts/contracts/util/TokenLimitedSupply.sol/TokenLimitedSupply.json';
import ERC20UnlimitedSupplyArtifact from '../artifacts/contracts/contracts/util/TokenUnlimitedAccount.sol/TokenUnlimitedAccount.json';
import { AssetPool } from '../models/AssetPool';
import { Contract } from 'web3-eth-contract';
import { BigNumber } from '@ethersproject/bignumber';
import { utils } from 'ethers/lib';
import axios from 'axios';

export enum NetworkProvider {
    Test = 0,
    Main = 1,
}

export const SolutionArtifact = IDefaultDiamondArtifact;
export const FactoryArtifact = AssetPoolFactoryArtifact;

export const getProvider = (npid: NetworkProvider) => {
    switch (npid) {
        case NetworkProvider.Test:
            return new Web3(TESTNET_RPC);
        case NetworkProvider.Main:
            return new Web3(RPC);
    }
};

export async function getGasPrice(npid: NetworkProvider) {
    const web3 = getProvider(npid);

    if (ENVIRONMENT === 'test') {
        return await web3.eth.getGasPrice();
    }
    const r: any = await axios.get('https://gasstation-mainnet.matic.network');

    return web3.utils.toWei(r.data.fast.toString(), 'gwei').toString();
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

    const data = fn.encodeABI(from);
    const estimate = await fn.estimateGas();
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
            return new web3.eth.Contract(AssetPoolFactoryArtifact.abi as any, TESTNET_ASSET_POOL_FACTORY_ADDRESS, {
                from: admin.address,
            });
        case NetworkProvider.Main:
            return new web3.eth.Contract(AssetPoolFactoryArtifact.abi as any, ASSET_POOL_FACTORY_ADDRESS, {
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
        ERC20UnlimitedSupplyArtifact.abi,
        ERC20UnlimitedSupplyArtifact.bytecode,
        [name, symbol, to],
        npid,
    );
}

export async function deployLimitedSupplyERC20Contract(
    npid: NetworkProvider,
    name: string,
    symbol: string,
    to: string,
    totalSupply: BigNumber,
) {
    return await deployContract(
        ERC20LimitedSupplyArtifact.abi,
        ERC20LimitedSupplyArtifact.bytecode,
        [name, symbol, to, totalSupply],
        npid,
    );
}

export const solutionContract = (npid: NetworkProvider, address: string): Contract => {
    const web3 = getProvider(npid);
    return new web3.eth.Contract(IDefaultDiamondArtifact.abi as any, address, {
        from: getAdmin(npid).address,
    });
};

function getWSProvider(npid: NetworkProvider) {
    switch (npid) {
        case NetworkProvider.Test:
            return new Web3(new Web3.providers.WebsocketProvider(TESTNET_RPC_WSS));
        case NetworkProvider.Main:
            return new Web3(new Web3.providers.WebsocketProvider(RPC_WSS));
    }
}

export const solutionWSContract = (npid: NetworkProvider, address: string): Contract => {
    const web3 = getWSProvider(npid);

    return new web3.eth.Contract(IDefaultDiamondArtifact.abi as any, address, {
        from: getAdmin(npid).address,
    });
};

export const tokenContract = (npid: NetworkProvider, address: string): Contract => {
    const web3 = getProvider(npid);
    return new web3.eth.Contract(ERC20Artifact.abi as any, address, {
        from: getAdmin(npid).address,
    });
};

export async function parseHeader(req: HttpRequest, res: Response, next: NextFunction) {
    const address = req.header('AssetPool') || req.params.address;

    if (address && isAddress(address)) {
        const assetPool = await AssetPool.findOne({ address });

        if (!assetPool) {
            return next(new HttpError(404, 'Asset Pool is not found in database.'));
        }

        (req as HttpRequest).assetPool = assetPool;
        (req as HttpRequest).solution = solutionContract(assetPool.network, address);
    }

    return next();
}
