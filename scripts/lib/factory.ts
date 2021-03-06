import AccessControlArtifact from '../../src/artifacts/contracts/contracts/01-AccessControl/AccessControl.sol/AccessControl.json';
import MemberAccessArtifact from '../../src/artifacts/contracts/contracts/03-MemberAccess/MemberAccess.sol/MemberAccess.json';
import TokenArtifact from '../../src/artifacts/contracts/contracts/04-Token/Token.sol/Token.json';
import BasePollProxyArtifact from '../../src/artifacts/contracts/contracts/08-BasePoll/BasePollProxy.sol/BasePollProxy.json';
import GasStationArtifact from '../../src/artifacts/contracts/contracts/07-GasStation/GasStation.sol/GasStationFacet.json';

import WithdrawArtifact from '../../src/artifacts/contracts/contracts/05-Withdraw/Withdraw.sol/Withdraw.json';
import WithdrawPollArtifact from '../../src/artifacts/contracts/contracts/05-Withdraw/WithdrawPoll.sol/WithdrawPoll.json';
import WithdrawPollProxyArtifact from '../../src/artifacts/contracts/contracts/05-Withdraw/WithdrawPollProxy.sol/WithdrawPollProxy.json';

import RewardArtifact from '../../src/artifacts/contracts/contracts/06-Reward/Reward.sol/Reward.json';
import RewardPollArtifact from '../../src/artifacts/contracts/contracts/06-Reward/RewardPoll.sol/RewardPoll.json';
import RewardPollProxyArtifact from '../../src/artifacts/contracts/contracts/06-Reward/RewardPollProxy.sol/RewardPollProxy.json';

import DiamondCutFacetArtifact from '../../src/artifacts/diamond-2/contracts/facets/DiamondCutFacet.sol/DiamondCutFacet.json';
import DiamondLoupeFacetArtifact from '../../src/artifacts/diamond-2/contracts/facets/DiamondLoupeFacet.sol/DiamondLoupeFacet.json';
import OwnershipFacetArtifact from '../../src/artifacts/diamond-2/contracts/facets/OwnershipFacet.sol/OwnershipFacet.json';
import UpdateDiamondFacetArtifact from '../../src/artifacts/contracts/contracts/11-UpdateDiamond/UpdateDiamond.sol/UpdateDiamond.json';

import DiamondArtifact from '../../src/artifacts/diamond-2/contracts/Diamond.sol/Diamond.json';
import AssetPoolFactoryFacetArtifact from '../../src/artifacts/contracts/contracts/AssetPoolFactory/AssetPoolFactoryFacet.sol/AssetPoolFactoryFacet.json';
import IAssetPoolFactory from '../../src/artifacts/contracts/contracts/AssetPoolFactory/IAssetPoolFactory.sol/IAssetPoolFactory.json';

import {
    deployContract,
    getProvider,
    getAdmin,
    NetworkProvider,
    getSelectors,
    sendTransaction,
} from '../../src/util/network';

async function deployFacets(npid: NetworkProvider) {
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
        const facet = await deployContract(artifacts[i].abi, artifacts[i].bytecode, [], npid);

        facets.push(facet);
    }

    return facets;
}

export const deployAssetPoolFactory = async (npid: NetworkProvider) => {
    const FacetCutAction = {
        Add: 0,
        Replace: 1,
        Remove: 2,
    };

    const AssetPoolFactoryFacet = await deployContract(
        AssetPoolFactoryFacetArtifact.abi,
        AssetPoolFactoryFacetArtifact.bytecode,
        [],
        npid,
    );
    const OwnershipFacet = await deployContract(OwnershipFacetArtifact.abi, OwnershipFacetArtifact.bytecode, [], npid);

    const facets = await deployFacets(npid);
    const factoryFacets = [AssetPoolFactoryFacet, OwnershipFacet];

    const diamondCut: any[] = [];
    const factoryDiamondCut: any[] = [];

    facets.forEach((facet) => {
        diamondCut.push({
            action: FacetCutAction.Add,
            facetAddress: facet.options.address,
            functionSelectors: getSelectors(facet),
        });
    });

    factoryFacets.forEach((f) => {
        factoryDiamondCut.push({
            action: FacetCutAction.Add,
            facetAddress: f.options.address,
            functionSelectors: getSelectors(f),
        });
    });

    const web3 = getProvider(npid);
    const diamond = await deployContract(
        DiamondArtifact.abi,
        DiamondArtifact.bytecode,
        [factoryDiamondCut, [getAdmin(npid).address]],
        npid,
    );
    const factory = new web3.eth.Contract(IAssetPoolFactory.abi as any, diamond.options.address, {
        from: getAdmin(npid).address,
    });

    await sendTransaction(factory.options.address, factory.methods.initialize(diamondCut), npid);

    return factory.options.address;
};
