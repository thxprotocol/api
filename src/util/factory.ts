import { COLLECTOR } from './secrets';
import { Contract, ethers, utils, Wallet } from 'ethers/lib';

import AccessControlArtifact from '../../src/artifacts/contracts/contracts/01-AccessControl/AccessControl.sol/AccessControl.json';
import MemberAccessArtifact from '../../src/artifacts/contracts/contracts/03-MemberAccess/MemberAccess.sol/MemberAccess.json';
import TokenArtifact from '../../src/artifacts/contracts/contracts/04-Token/Token.sol/Token.json';
import BasePollProxyArtifact from '../../src/artifacts/contracts/contracts/08-BasePoll/BasePollProxy.sol/BasePollProxy.json';
import GasStationArtifact from '../../src/artifacts/contracts/contracts/07-GasStation/GasStation.sol/GasStationFacet.json';

import WithdrawArtifact from '../../src/artifacts/contracts/contracts/05-Withdraw/Withdraw.sol/Withdraw.json';
import WithdrawPollArtifact from '../../src/artifacts/contracts/contracts/05-Withdraw/WithdrawPoll.sol/WithdrawPoll.json';
import WithdrawPollProxyArtifact from '../../src/artifacts/contracts/contracts/05-Withdraw/WithdrawPollProxy.sol/WithdrawPollProxy.json';

import WithdrawByArtifact from '../../src/artifacts/contracts/contracts/09-WithdrawBypass/WithdrawBy.sol/WithdrawBy.json';
import WithdrawByPollArtifact from '../../src/artifacts/contracts/contracts/09-WithdrawBypass/WithdrawByPoll.sol/WithdrawByPoll.json';
import WithdrawByPollProxyArtifact from '../../src/artifacts/contracts/contracts/09-WithdrawBypass/WithdrawByPollProxy.sol/WithdrawByPollProxy.json';

import RewardArtifact from '../../src/artifacts/contracts/contracts/06-Reward/Reward.sol/Reward.json';
import RewardPollArtifact from '../../src/artifacts/contracts/contracts/06-Reward/RewardPoll.sol/RewardPoll.json';
import RewardPollProxyArtifact from '../../src/artifacts/contracts/contracts/06-Reward/RewardPollProxy.sol/RewardPollProxy.json';

import RewardByArtifact from '../../src/artifacts/contracts/contracts/10-RewardBypass/RewardBy.sol/RewardBy.json';
import RewardByPollArtifact from '../../src/artifacts/contracts/contracts/10-RewardBypass/RewardByPoll.sol/RewardByPoll.json';
import RewardByPollProxyArtifact from '../../src/artifacts/contracts/contracts/10-RewardBypass/RewardByPollProxy.sol/RewardByPollProxy.json';

import DiamondCutFacetArtifact from '../../src/artifacts/diamond-2/contracts/facets/DiamondCutFacet.sol/DiamondCutFacet.json';
import DiamondLoupeFacetArtifact from '../../src/artifacts/diamond-2/contracts/facets/DiamondLoupeFacet.sol/DiamondLoupeFacet.json';
import OwnershipFacetArtifact from '../../src/artifacts/diamond-2/contracts/facets/OwnershipFacet.sol/OwnershipFacet.json';
import UpdateDiamondFacetArtifact from '../../src/artifacts/contracts/contracts/11-UpdateDiamond/UpdateDiamond.sol/UpdateDiamond.json';

import DiamondArtifact from '../../src/artifacts/diamond-2/contracts/Diamond.sol/Diamond.json';
import AssetPoolFactoryFacetArtifact from '../../src/artifacts/contracts/contracts/AssetPoolFactory/AssetPoolFactoryFacet.sol/AssetPoolFactoryFacet.json';
import IAssetPoolFactory from '../../src/artifacts/contracts/contracts/AssetPoolFactory/IAssetPoolFactory.sol/IAssetPoolFactory.json';

import PoolRegistryArtifact from '../../src/artifacts/contracts/contracts/PoolRegistry.sol/PoolRegistry.json';
import { admin } from './network';

async function deployFacets(signer: Wallet) {
    const artifacts = [
        AccessControlArtifact,
        MemberAccessArtifact,
        TokenArtifact,
        BasePollProxyArtifact,
        GasStationArtifact,
        WithdrawArtifact,
        WithdrawPollArtifact,
        WithdrawPollProxyArtifact,
        RewardArtifact,
        RewardPollArtifact,
        RewardPollProxyArtifact,
        DiamondCutFacetArtifact,
        DiamondLoupeFacetArtifact,
        OwnershipFacetArtifact,
        UpdateDiamondFacetArtifact,
    ];
    const facets = [];

    for (let i = 0; i < artifacts.length; i++) {
        const factory = new ethers.ContractFactory(artifacts[i].abi, artifacts[i].bytecode, signer);
        const facet = await factory.deploy();

        await facet.deployTransaction.wait();

        facets.push(facet);
    }

    return facets;
}

function getSelectors(contract: Contract) {
    const signatures = [];
    for (const key of Object.keys(contract.functions)) {
        signatures.push(utils.keccak256(utils.toUtf8Bytes(key)).substr(0, 10));
    }
    return signatures;
}

export const deployPoolRegistry = async (signer: Wallet) => {
    const poolRegistryFactory = new ethers.ContractFactory(
        PoolRegistryArtifact.abi,
        PoolRegistryArtifact.bytecode,
        signer,
    );
    const registry = await poolRegistryFactory.deploy(COLLECTOR, 0);

    return registry.address;
};

export const deployAssetPoolFactory = async (signer: Wallet) => {
    const FacetCutAction = {
        Add: 0,
        Replace: 1,
        Remove: 2,
    };
    const AssetPoolFactoryFactory = new ethers.ContractFactory(
        AssetPoolFactoryFacetArtifact.abi,
        AssetPoolFactoryFacetArtifact.bytecode,
        signer,
    );
    const AssetPoolFactoryFacet = await AssetPoolFactoryFactory.deploy();

    await AssetPoolFactoryFacet.deployTransaction.wait();

    const OwnershipFactory = new ethers.ContractFactory(
        OwnershipFacetArtifact.abi,
        OwnershipFacetArtifact.bytecode,
        signer,
    );
    const OwnershipFacet = await OwnershipFactory.deploy();

    await OwnershipFacet.deployTransaction.wait();

    const facets = await deployFacets(signer);
    const factoryFacets = [AssetPoolFactoryFacet, OwnershipFacet];

    const diamondCut: any[] = [];
    const factoryDiamondCut: any[] = [];

    facets.forEach((facet) => {
        diamondCut.push({
            action: FacetCutAction.Add,
            facetAddress: facet.address,
            functionSelectors: getSelectors(facet),
        });
    });

    factoryFacets.forEach((f) => {
        factoryDiamondCut.push({
            action: FacetCutAction.Add,
            facetAddress: f.address,
            functionSelectors: getSelectors(f),
        });
    });

    const DiamondFactory = new ethers.ContractFactory(DiamondArtifact.abi, DiamondArtifact.bytecode, signer);
    const diamond = await DiamondFactory.deploy(factoryDiamondCut, [await signer.getAddress()]);

    await diamond.deployTransaction.wait();

    const factory = new ethers.Contract(diamond.address, IAssetPoolFactory.abi, signer);

    await factory.initialize(diamondCut);

    return factory.address;
};

export const downgradeFromBypassPolls = async (solution: Contract) => {
    const withdrawFacetFactory = new ethers.ContractFactory(WithdrawArtifact.abi, WithdrawArtifact.bytecode, admin);
    const withdrawPollFacetFactory = new ethers.ContractFactory(
        WithdrawPollArtifact.abi,
        WithdrawPollArtifact.bytecode,
        admin,
    );
    const withdrawPollProxyFacetFactory = new ethers.ContractFactory(
        WithdrawPollProxyArtifact.abi,
        WithdrawPollProxyArtifact.bytecode,
        admin,
    );

    const rewardFacetFactory = new ethers.ContractFactory(RewardArtifact.abi, RewardArtifact.bytecode, admin);
    const rewardPollFacetFactory = new ethers.ContractFactory(
        RewardPollArtifact.abi,
        RewardPollArtifact.bytecode,
        admin,
    );
    const rewardPollProxyFacetFactory = new ethers.ContractFactory(
        RewardPollProxyArtifact.abi,
        RewardPollProxyArtifact.bytecode,
        admin,
    );

    const withdrawFacet = await withdrawFacetFactory.deploy();
    await withdrawFacet.deployTransaction.wait();
    const withdrawPollFacet = await withdrawPollFacetFactory.deploy();
    await withdrawPollFacet.deployTransaction.wait();
    const withdrawPollProxyFacet = await withdrawPollProxyFacetFactory.deploy();
    await withdrawPollProxyFacet.deployTransaction.wait();

    const rewardFacet = await rewardFacetFactory.deploy();
    await rewardFacet.deployTransaction.wait();
    const rewardPollFacet = await rewardPollFacetFactory.deploy();
    await rewardPollFacet.deployTransaction.wait();
    const rewardPollProxyFacet = await rewardPollProxyFacetFactory.deploy();
    await rewardPollProxyFacet.deployTransaction.wait();

    await solution.updateAssetPool(getSelectors(withdrawFacet), withdrawFacet.address);
    await solution.updateAssetPool(getSelectors(withdrawPollFacet), withdrawPollFacet.address);
    await solution.updateAssetPool(getSelectors(withdrawPollProxyFacet), withdrawPollProxyFacet.address);

    await solution.updateAssetPool(getSelectors(rewardFacet), rewardFacet.address);
    await solution.updateAssetPool(getSelectors(rewardPollFacet), rewardPollFacet.address);
    await solution.updateAssetPool(getSelectors(rewardPollProxyFacet), rewardPollProxyFacet.address);
};

export const updateToBypassPolls = async (solution: Contract) => {
    const withdrawByFacetFactory = new ethers.ContractFactory(
        WithdrawByArtifact.abi,
        WithdrawByArtifact.bytecode,
        admin,
    );
    const withdrawByPollFacetFactory = new ethers.ContractFactory(
        WithdrawByPollArtifact.abi,
        WithdrawByPollArtifact.bytecode,
        admin,
    );
    const withdrawByPollProxyFacetFactory = new ethers.ContractFactory(
        WithdrawByPollProxyArtifact.abi,
        WithdrawByPollProxyArtifact.bytecode,
        admin,
    );

    const rewardByFacetFactory = new ethers.ContractFactory(RewardByArtifact.abi, RewardByArtifact.bytecode, admin);
    const rewardByPollFacetFactory = new ethers.ContractFactory(
        RewardByPollArtifact.abi,
        RewardByPollArtifact.bytecode,
        admin,
    );
    const rewardByPollProxyFacetFactory = new ethers.ContractFactory(
        RewardByPollProxyArtifact.abi,
        RewardByPollProxyArtifact.bytecode,
        admin,
    );

    const withdrawByFacet = await withdrawByFacetFactory.deploy();
    await withdrawByFacet.deployTransaction.wait();
    const withdrawByPollFacet = await withdrawByPollFacetFactory.deploy();
    await withdrawByPollFacet.deployTransaction.wait();
    const withdrawByPollProxyFacet = await withdrawByPollProxyFacetFactory.deploy();
    await withdrawByPollProxyFacet.deployTransaction.wait();

    const rewardByFacet = await rewardByFacetFactory.deploy();
    await rewardByFacet.deployTransaction.wait();
    const rewardByPollFacet = await rewardByPollFacetFactory.deploy();
    await rewardByPollFacet.deployTransaction.wait();
    const rewardByPollProxyFacet = await rewardByPollProxyFacetFactory.deploy();
    await rewardByPollProxyFacet.deployTransaction.wait();

    await solution.updateAssetPool(getSelectors(withdrawByFacet), withdrawByFacet.address);
    await solution.updateAssetPool(getSelectors(withdrawByPollFacet), withdrawByPollFacet.address);
    await solution.updateAssetPool(getSelectors(withdrawByPollProxyFacet), withdrawByPollProxyFacet.address);

    await solution.updateAssetPool(getSelectors(rewardByFacet), rewardByFacet.address);
    await solution.updateAssetPool(getSelectors(rewardByPollFacet), rewardByPollFacet.address);
    await solution.updateAssetPool(getSelectors(rewardByPollProxyFacet), rewardByPollProxyFacet.address);
};
