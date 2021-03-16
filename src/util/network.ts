import { NextFunction, Request, Response } from 'express';
import { RPC, PRIVATE_KEY, ASSET_POOL_FACTORY_ADDRESS } from '../util/secrets';
import { BigNumber, Contract, ContractFactory, ethers, utils } from 'ethers';
import { logger } from '../util/logger';

import { isAddress } from 'ethers/lib/utils';
import { HttpRequest } from '../models/Error';

import AssetPoolFactoryArtifact from '../artifacts/contracts/contracts/AssetPoolFactory.sol/AssetPoolFactory.json';
import ISolutionArtifact from '../artifacts/contracts/contracts/IDefaultDiamond.sol/IDefaultDiamond.json';
import ERC20Artifact from '../artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json';

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

export const SolutionArtifact = ISolutionArtifact;
export const provider = new ethers.providers.WebSocketProvider(RPC);
export const admin = new ethers.Wallet(PRIVATE_KEY, provider);

export const assetPoolFactory = new ethers.Contract(ASSET_POOL_FACTORY_ADDRESS, AssetPoolFactoryArtifact.abi, admin);

export const logTransaction = (tx: { from: string; to: string; transactionHash: string; gasUsed: BigNumber }) => {
    logger.info(`From: ${tx.from} To: ${tx.to} Gas: ${tx.gasUsed.toNumber()} TX:${tx.transactionHash}`);
    return tx;
};

export const solutionContract = (address?: string) => {
    return new ethers.Contract(address, ISolutionArtifact.abi, admin);
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

export const downgradeFromBypassPolls = async (solution: Contract) => {
    const withdrawFacetFactory = new ContractFactory(WithdrawArtifact.abi, WithdrawArtifact.bytecode, admin);
    const withdrawPollFacetFactory = new ContractFactory(
        WithdrawPollArtifact.abi,
        WithdrawPollArtifact.bytecode,
        admin,
    );
    const withdrawPollProxyFacetFactory = new ContractFactory(
        WithdrawPollProxyArtifact.abi,
        WithdrawPollProxyArtifact.bytecode,
        admin,
    );

    const rewardFacetFactory = new ContractFactory(RewardArtifact.abi, RewardArtifact.bytecode, admin);
    const rewardPollFacetFactory = new ContractFactory(RewardPollArtifact.abi, RewardPollArtifact.bytecode, admin);
    const rewardPollProxyFacetFactory = new ContractFactory(
        RewardPollProxyArtifact.abi,
        RewardPollProxyArtifact.bytecode,
        admin,
    );

    const withdrawFacet = await withdrawFacetFactory.deploy();
    const withdrawPollFacet = await withdrawPollFacetFactory.deploy();
    const withdrawPollProxyFacet = await withdrawPollProxyFacetFactory.deploy();

    const rewardFacet = await rewardFacetFactory.deploy();
    const rewardPollFacet = await rewardPollFacetFactory.deploy();
    const rewardPollProxyFacet = await rewardPollProxyFacetFactory.deploy();

    await solution.updateAssetPool(getSelectors(withdrawFacet), withdrawFacet.address);
    await solution.updateAssetPool(getSelectors(withdrawPollFacet), withdrawPollFacet.address);
    await solution.updateAssetPool(getSelectors(withdrawPollProxyFacet), withdrawPollProxyFacet.address);

    await solution.updateAssetPool(getSelectors(rewardFacet), rewardFacet.address);
    await solution.updateAssetPool(getSelectors(rewardPollFacet), rewardPollFacet.address);
    await solution.updateAssetPool(getSelectors(rewardPollProxyFacet), rewardPollProxyFacet.address);
};

export const updateToBypassPolls = async (solution: Contract) => {
    const withdrawByFacetFactory = new ContractFactory(WithdrawByArtifact.abi, WithdrawByArtifact.bytecode, admin);
    const withdrawByPollFacetFactory = new ContractFactory(
        WithdrawByPollArtifact.abi,
        WithdrawByPollArtifact.bytecode,
        admin,
    );
    const withdrawByPollProxyFacetFactory = new ContractFactory(
        WithdrawByPollProxyArtifact.abi,
        WithdrawByPollProxyArtifact.bytecode,
        admin,
    );

    const rewardByFacetFactory = new ContractFactory(RewardByArtifact.abi, RewardByArtifact.bytecode, admin);
    const rewardByPollFacetFactory = new ContractFactory(
        RewardByPollArtifact.abi,
        RewardByPollArtifact.bytecode,
        admin,
    );
    const rewardByPollProxyFacetFactory = new ContractFactory(
        RewardByPollProxyArtifact.abi,
        RewardByPollProxyArtifact.bytecode,
        admin,
    );

    const withdrawByFacet = await withdrawByFacetFactory.deploy();
    const withdrawByPollFacet = await withdrawByPollFacetFactory.deploy();
    const withdrawByPollProxyFacet = await withdrawByPollProxyFacetFactory.deploy();

    const rewardByFacet = await rewardByFacetFactory.deploy();
    const rewardByPollFacet = await rewardByPollFacetFactory.deploy();
    const rewardByPollProxyFacet = await rewardByPollProxyFacetFactory.deploy();

    await solution.updateAssetPool(getSelectors(withdrawByFacet), withdrawByFacet.address);
    await solution.updateAssetPool(getSelectors(withdrawByPollFacet), withdrawByPollFacet.address);
    await solution.updateAssetPool(getSelectors(withdrawByPollProxyFacet), withdrawByPollProxyFacet.address);

    await solution.updateAssetPool(getSelectors(rewardByFacet), rewardByFacet.address);
    await solution.updateAssetPool(getSelectors(rewardByPollFacet), rewardByPollFacet.address);
    await solution.updateAssetPool(getSelectors(rewardByPollProxyFacet), rewardByPollProxyFacet.address);
};

// export const updateToBypassPolls = async (solution: Contract) => {
//     const withdrawPollFacetBypassFactory = new ContractFactory(
//         WithdrawPollFacetBypassArtifact.abi,
//         WithdrawPollFacetBypassArtifact.bytecode,
//         admin,
//     );
//     const rewardPollFacetBypassFactory = new ContractFactory(
//         RewardPollFacetBypassArtifact.abi,
//         RewardPollFacetBypassArtifact.bytecode,
//         admin,
//     );
//     const withdrawPollFacetBypass = await withdrawPollFacetBypassFactory.deploy();
//     const rewardPollFacetBypass = await rewardPollFacetBypassFactory.deploy();

//     await solution.updateAssetPool(getSelectors(withdrawPollFacetBypass), withdrawPollFacetBypass.address);
//     await solution.updateAssetPool(getSelectors(rewardPollFacetBypass), rewardPollFacetBypass.address);
// };
