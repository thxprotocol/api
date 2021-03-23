import { NextFunction, Request, Response } from 'express';
import { RPC, PRIVATE_KEY, ASSET_POOL_FACTORY_ADDRESS } from '../util/secrets';
import { BigNumber, Contract, ContractFactory, ethers, utils } from 'ethers';
import { logger } from '../util/logger';

import { isAddress } from 'ethers/lib/utils';
import { HttpRequest } from '../models/Error';

import AssetPoolFactoryArtifact from '../artifacts/contracts/contracts/AssetPoolFactory/IAssetPoolFactory.sol/IAssetPoolFactory.json';
import IDefaultDiamondArtifact from '../artifacts/contracts/contracts/IDefaultDiamond.sol/IDefaultDiamond.json';
import ERC20Artifact from '../artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json';
import ERC20UnlimitedSupplyArtifact from '../artifacts/contracts/contracts/util/TokenUnlimitedAccount.sol/TokenUnlimitedAccount.json';

import WithdrawArtifact from '../artifacts/contracts/contracts/05-Withdraw/Withdraw.sol/Withdraw.json';
import WithdrawPollArtifact from '../artifacts/contracts/contracts/05-Withdraw/WithdrawPoll.sol/WithdrawPoll.json';
import WithdrawPollProxyArtifact from '../artifacts/contracts/contracts/05-Withdraw/WithdrawPollProxy.sol/WithdrawPollProxy.json';

import WithdrawByArtifact from '../artifacts/contracts/contracts/09-WithdrawBypass/WithdrawBy.sol/WithdrawBy.json';
import WithdrawByPollArtifact from '../artifacts/contracts/contracts/09-WithdrawBypass/WithdrawByPoll.sol/WithdrawByPoll.json';
import WithdrawByPollProxyArtifact from '../artifacts/contracts/contracts/09-WithdrawBypass/WithdrawByPollProxy.sol/WithdrawByPollProxy.json';

import RewardArtifact from '../artifacts/contracts/contracts/06-Reward/Reward.sol/Reward.json';
import RewardPollArtifact from '../artifacts/contracts/contracts/06-Reward/RewardPoll.sol/RewardPoll.json';
import RewardPollProxyArtifact from '../artifacts/contracts/contracts/06-Reward/RewardPollProxy.sol/RewardPollProxy.json';

import RewardByArtifact from '../artifacts/contracts/contracts/10-RewardBypass/RewardBy.sol/RewardBy.json';
import RewardByPollArtifact from '../artifacts/contracts/contracts/10-RewardBypass/RewardByPoll.sol/RewardByPoll.json';
import RewardByPollProxyArtifact from '../artifacts/contracts/contracts/10-RewardBypass/RewardByPollProxy.sol/RewardByPollProxy.json';

export const SolutionArtifact = IDefaultDiamondArtifact;
export const provider = new ethers.providers.WebSocketProvider(RPC);
export const admin = new ethers.Wallet(PRIVATE_KEY, provider);

export const assetPoolFactory = new ethers.Contract(ASSET_POOL_FACTORY_ADDRESS, AssetPoolFactoryArtifact.abi, admin);

export const unlimitedSupplyERC20Factory = new ContractFactory(
    ERC20UnlimitedSupplyArtifact.abi,
    ERC20UnlimitedSupplyArtifact.bytecode,
    admin,
);

export const limitedSupplyERC20Factory = new ContractFactory(ERC20Artifact.abi, ERC20Artifact.bytecode, admin);

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
    const assetPollAddress = req.header('AssetPool');

    if (assetPollAddress && isAddress(assetPollAddress)) {
        (req as HttpRequest).solution = solutionContract(assetPollAddress);
    }

    return next();
}

const getSelectors = function (contract: Contract) {
    const signatures = [];
    for (const key of Object.keys(contract.functions)) {
        signatures.push(utils.keccak256(utils.toUtf8Bytes(key)).substr(0, 10));
    }

    return signatures;
};
