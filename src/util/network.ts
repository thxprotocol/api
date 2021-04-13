import { NextFunction, Response } from 'express';
import {
    RPC,
    PRIVATE_KEY,
    TESTNET_RPC,
    TESTNET_ASSET_POOL_FACTORY_ADDRESS,
    ASSET_POOL_FACTORY_ADDRESS,
    RPC_WSS,
    TESTNET_RPC_WSS,
} from '../util/secrets';
import { BigNumber, ContractFactory, ethers, providers, Wallet } from 'ethers';
import { logger } from '../util/logger';

import { isAddress } from 'ethers/lib/utils';
import { HttpError, HttpRequest } from '../models/Error';

import AssetPoolFactoryArtifact from '../artifacts/contracts/contracts/AssetPoolFactory/IAssetPoolFactory.sol/IAssetPoolFactory.json';
import IDefaultDiamondArtifact from '../artifacts/contracts/contracts/IDefaultDiamond.sol/IDefaultDiamond.json';
import ERC20Artifact from '../artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json';
import ERC20LimitedSupplyArtifact from '../artifacts/contracts/contracts/util/TokenLimitedSupply.sol/TokenLimitedSupply.json';
import ERC20UnlimitedSupplyArtifact from '../artifacts/contracts/contracts/util/TokenUnlimitedAccount.sol/TokenUnlimitedAccount.json';
import { AssetPool } from '../models/AssetPool';

export enum NetworkProvider {
    Test = 0,
    Main = 1,
}

export const SolutionArtifact = IDefaultDiamondArtifact;

export const getProvider = (npid: NetworkProvider) => {
    switch (npid) {
        case NetworkProvider.Test:
            return new providers.WebSocketProvider(TESTNET_RPC_WSS);
        case NetworkProvider.Main:
            return new providers.WebSocketProvider(RPC_WSS);
    }
};

export const getAdmin = (npid: NetworkProvider) => {
    return new Wallet(PRIVATE_KEY, getProvider(npid));
};

export const getAssetPoolFactory = (npid: NetworkProvider) => {
    const admin = getAdmin(npid);
    switch (npid) {
        case NetworkProvider.Test:
            return new ethers.Contract(TESTNET_ASSET_POOL_FACTORY_ADDRESS, AssetPoolFactoryArtifact.abi, admin);
        case NetworkProvider.Main:
            return new ethers.Contract(ASSET_POOL_FACTORY_ADDRESS, AssetPoolFactoryArtifact.abi, admin);
    }
};

export const getUnlimitedSupplyERC20Factory = (npid: NetworkProvider) => {
    return new ContractFactory(ERC20UnlimitedSupplyArtifact.abi, ERC20UnlimitedSupplyArtifact.bytecode, getAdmin(npid));
};

export const getLimitedSupplyERC20Factory = (npid: NetworkProvider) => {
    return new ContractFactory(ERC20LimitedSupplyArtifact.abi, ERC20LimitedSupplyArtifact.bytecode, getAdmin(npid));
};

export const logTransaction = (tx: { from: string; to: string; transactionHash: string; gasUsed: BigNumber }) => {
    logger.info(`From: ${tx.from} To: ${tx.to} Gas: ${tx.gasUsed.toNumber()} TX:${tx.transactionHash}`);
    return tx;
};

export const solutionContract = (npid: NetworkProvider, address: string) => {
    return new ethers.Contract(address, IDefaultDiamondArtifact.abi, getAdmin(npid));
};

export const tokenContract = (npid: NetworkProvider, address: string) => {
    return new ethers.Contract(address, ERC20Artifact.abi, getAdmin(npid));
};

export async function parseHeader(req: HttpRequest, res: Response, next: NextFunction) {
    const address = req.header('AssetPool');

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
