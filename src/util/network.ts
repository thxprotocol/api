import { NextFunction, Request, Response } from 'express';
import { WSS_RPC, RPC, PRIVATE_KEY, ASSET_POOL_FACTORY_ADDRESS } from '../util/secrets';
import { BigNumber, ContractFactory, ethers } from 'ethers';
import { logger } from '../util/logger';

import { isAddress } from 'ethers/lib/utils';
import { HttpRequest } from '../models/Error';

import AssetPoolFactoryArtifact from '../artifacts/contracts/contracts/AssetPoolFactory/IAssetPoolFactory.sol/IAssetPoolFactory.json';
import IDefaultDiamondArtifact from '../artifacts/contracts/contracts/IDefaultDiamond.sol/IDefaultDiamond.json';
import ERC20Artifact from '../artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json';
import ERC20LimitedSupplyArtifact from '../artifacts/contracts/contracts/util/TokenLimitedSupply.sol/TokenLimitedSupply.json';
import ERC20UnlimitedSupplyArtifact from '../artifacts/contracts/contracts/util/TokenUnlimitedAccount.sol/TokenUnlimitedAccount.json';

export const SolutionArtifact = IDefaultDiamondArtifact;
export const wssProvider = new ethers.providers.WebSocketProvider(WSS_RPC);
export const provider = new ethers.providers.JsonRpcProvider(RPC);
export const admin = new ethers.Wallet(PRIVATE_KEY, provider);

export const assetPoolFactory = new ethers.Contract(ASSET_POOL_FACTORY_ADDRESS, AssetPoolFactoryArtifact.abi, admin);

export const unlimitedSupplyERC20Factory = new ContractFactory(
    ERC20UnlimitedSupplyArtifact.abi,
    ERC20UnlimitedSupplyArtifact.bytecode,
    admin,
);

export const limitedSupplyERC20Factory = new ContractFactory(
    ERC20LimitedSupplyArtifact.abi,
    ERC20LimitedSupplyArtifact.bytecode,
    admin,
);

export const logTransaction = (tx: { from: string; to: string; transactionHash: string; gasUsed: BigNumber }) => {
    logger.info(`From: ${tx.from} To: ${tx.to} Gas: ${tx.gasUsed.toNumber()} TX:${tx.transactionHash}`);
    return tx;
};

export const solutionContract = (address?: string) => {
    return new ethers.Contract(address, IDefaultDiamondArtifact.abi, admin);
};
export const tokenContract = (address?: string) => {
    return new ethers.Contract(address, ERC20Artifact.abi, admin);
};
export function parseHeader(req: Request, res: Response, next: NextFunction) {
    const assetPoolAddress = req.header('AssetPool');

    if (assetPoolAddress && isAddress(assetPoolAddress)) {
        (req as HttpRequest).solution = solutionContract(assetPoolAddress);
    }

    return next();
}
