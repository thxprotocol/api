import { NextFunction, Request, Response } from 'express';
import { RPC, PRIVATE_KEY, ASSET_POOL_FACTORY_ADDRESS } from '../util/secrets';
import { Contract, ContractFactory, ethers, utils } from 'ethers';
import { isAddress } from 'ethers/lib/utils';
import { HttpRequest } from '../models/Error';

import AssetPoolFactoryArtifact from '../artifacts/contracts/contracts/factories/AssetPoolFactory.sol/AssetPoolFactory.json';
import ISolutionArtifact from '../artifacts/contracts/contracts/interfaces/ISolution.sol/ISolution.json';
import ERC20Artifact from '../artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json';
import WithdrawPollFacetBypassArtifact from '../artifacts/contracts/contracts/facets/PollFacet/WithdrawPollFacetBypass.sol/WithdrawPollFacetBypass.json';
import RewardPollFacetBypassArtifact from '../artifacts/contracts/contracts/facets/PollFacet/RewardPollFacetBypass.sol/RewardPollFacetBypass.json';
import WithdrawPollFacetArtifact from '../artifacts/contracts/contracts/facets/PollFacet/WithdrawPollFacet.sol/WithdrawPollFacet.json';
import RewardPollFacetArtifact from '../artifacts/contracts/contracts/facets/PollFacet/RewardPollFacet.sol/RewardPollFacet.json';

export const provider = new ethers.providers.JsonRpcProvider(RPC);
export const admin = new ethers.Wallet(PRIVATE_KEY, provider);
export const assetPoolFactory = new ethers.Contract(ASSET_POOL_FACTORY_ADDRESS, AssetPoolFactoryArtifact.abi, admin);

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
    const withdrawPollFacetFactory = new ContractFactory(
        WithdrawPollFacetArtifact.abi,
        WithdrawPollFacetArtifact.bytecode,
        admin,
    );
    const rewardPollFacetFactory = new ContractFactory(
        RewardPollFacetArtifact.abi,
        RewardPollFacetArtifact.bytecode,
        admin,
    );

    const withdrawPollFacet = await withdrawPollFacetFactory.deploy();
    const rewardPollFacet = await rewardPollFacetFactory.deploy();

    await solution.updateAssetPool(getSelectors(withdrawPollFacet), withdrawPollFacet.address);
    await solution.updateAssetPool(getSelectors(rewardPollFacet), rewardPollFacet.address);
};

export const updateToBypassPolls = async (solution: Contract) => {
    const withdrawPollFacetBypassFactory = new ContractFactory(
        WithdrawPollFacetBypassArtifact.abi,
        WithdrawPollFacetBypassArtifact.bytecode,
        admin,
    );
    const rewardPollFacetBypassFactory = new ContractFactory(
        RewardPollFacetBypassArtifact.abi,
        RewardPollFacetBypassArtifact.bytecode,
        admin,
    );
    const withdrawPollFacetBypass = await withdrawPollFacetBypassFactory.deploy();
    const rewardPollFacetBypass = await rewardPollFacetBypassFactory.deploy();

    await solution.updateAssetPool(getSelectors(withdrawPollFacetBypass), withdrawPollFacetBypass.address);
    await solution.updateAssetPool(getSelectors(rewardPollFacetBypass), rewardPollFacetBypass.address);
};
