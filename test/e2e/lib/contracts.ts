import { admin } from './network';
import { Contract, ethers, utils } from 'ethers';

import ExampleTokenArtifact from '../../../src/artifacts/contracts/contracts/ExampleToken.sol/ExampleToken.json';
import AssetPoolFacetArtifact from '../../../src/artifacts/contracts/contracts/facets/AssetPoolFacet/AssetPoolFacet.sol/AssetPoolFacet.json';
import AssetPoolFacetViewArtifact from '../../../src/artifacts/contracts/contracts/facets/AssetPoolFacet/AssetPoolFacetView.sol/AssetPoolFacetView.json';
import RolesFacetArtifact from '../../../src/artifacts/contracts/contracts/facets/RolesFacet/RolesFacet.sol/RolesFacet.json';
import DiamondCutFacetArtifact from '../../../src/artifacts/diamond-2/contracts/facets/DiamondCutFacet.sol/DiamondCutFacet.json';
import DiamondLoupeFacetArtifact from '../../../src/artifacts/diamond-2/contracts/facets/DiamondLoupeFacet.sol/DiamondLoupeFacet.json';
import OwnershipFacetArtifact from '../../../src/artifacts/diamond-2/contracts/facets/OwnershipFacet.sol/OwnershipFacet.json';
import GasStationFacetArtifact from '../../../src/artifacts/contracts/contracts/facets/GasStationFacet/GasStation.sol/GasStationFacet.json';
import RewardPollFacetArtifact from '../../../src/artifacts/contracts/contracts/facets/PollFacet/RewardPollFacet.sol/RewardPollFacet.json';
import RewardPollProxyFacetArtifact from '../../../src/artifacts/contracts/contracts/facets/PollFacet/RewardPollProxyFacet.sol/RewardPollProxyFacet.json';
import WithdrawPollFacetArtifact from '../../../src/artifacts/contracts/contracts/facets/PollFacet/WithdrawPollFacet.sol/WithdrawPollFacet.json';
import WithdrawPollProxyFacetArtifact from '../../../src/artifacts/contracts/contracts/facets/PollFacet/WithdrawPollProxyFacet.sol/WithdrawPollProxyFacet.json';
import PollProxyFacetArtifact from '../../../src/artifacts/contracts/contracts/facets/PollFacet/PollProxyFacet.sol/PollProxyFacet.json';
import UpdateDiamondFacetArtifact from '../../../src/artifacts/contracts/contracts/factories/UpdateDiamondFacet.sol/UpdateDiamondFacet.json';
import AssetPoolFactoryArtifact from '../../../src/artifacts/contracts/contracts/factories/AssetPoolFactory.sol/AssetPoolFactory.json';

export const exampleTokenFactory = new ethers.ContractFactory(
    ExampleTokenArtifact.abi,
    ExampleTokenArtifact.bytecode,
    admin,
);

export const getAssetPoolFactory = async () => {
    const FacetCutAction = {
        Add: 0,
        Replace: 1,
        Remove: 2,
    };
    const getSelectors = function (contract: Contract) {
        const signatures = [];
        for (const key of Object.keys(contract.functions)) {
            signatures.push(utils.keccak256(utils.toUtf8Bytes(key)).substr(0, 10));
        }

        return signatures;
    };

    const AssetPoolFacet = new ethers.ContractFactory(
        AssetPoolFacetArtifact.abi,
        AssetPoolFacetArtifact.bytecode,
        admin,
    );
    const AssetPoolFacetView = new ethers.ContractFactory(
        AssetPoolFacetViewArtifact.abi,
        AssetPoolFacetViewArtifact.bytecode,
        admin,
    );
    const RolesFacet = new ethers.ContractFactory(RolesFacetArtifact.abi, RolesFacetArtifact.bytecode, admin);
    const DiamondCutFacet = new ethers.ContractFactory(
        DiamondCutFacetArtifact.abi,
        DiamondCutFacetArtifact.bytecode,
        admin,
    );
    const DiamondLoupeFacet = new ethers.ContractFactory(
        DiamondLoupeFacetArtifact.abi,
        DiamondLoupeFacetArtifact.bytecode,
        admin,
    );
    const OwnershipFacet = new ethers.ContractFactory(
        OwnershipFacetArtifact.abi,
        OwnershipFacetArtifact.bytecode,
        admin,
    );
    const GasStationFacet = new ethers.ContractFactory(
        GasStationFacetArtifact.abi,
        GasStationFacetArtifact.bytecode,
        admin,
    );
    const RewardPollFacet = new ethers.ContractFactory(
        RewardPollFacetArtifact.abi,
        RewardPollFacetArtifact.bytecode,
        admin,
    );
    const RewardPollProxyFacet = new ethers.ContractFactory(
        RewardPollProxyFacetArtifact.abi,
        RewardPollProxyFacetArtifact.bytecode,
        admin,
    );
    const WithdrawPollFacet = new ethers.ContractFactory(
        WithdrawPollFacetArtifact.abi,
        WithdrawPollFacetArtifact.bytecode,
        admin,
    );
    const WithdrawPollProxyFacet = new ethers.ContractFactory(
        WithdrawPollProxyFacetArtifact.abi,
        WithdrawPollProxyFacetArtifact.bytecode,
        admin,
    );
    const PollProxyFacet = new ethers.ContractFactory(
        PollProxyFacetArtifact.abi,
        PollProxyFacetArtifact.bytecode,
        admin,
    );
    const UpdateDiamondFacet = new ethers.ContractFactory(
        UpdateDiamondFacetArtifact.abi,
        UpdateDiamondFacetArtifact.bytecode,
        admin,
    );
    const AssetPoolFactory = new ethers.ContractFactory(
        AssetPoolFactoryArtifact.abi,
        AssetPoolFactoryArtifact.bytecode,
        admin,
    );

    const assetPoolFacet = await AssetPoolFacet.deploy();
    const updateDiamondFacet = await UpdateDiamondFacet.deploy();
    const assetPoolFacetView = await AssetPoolFacetView.deploy();
    const rolesFacet = await RolesFacet.deploy();
    const diamondCutFacet = await DiamondCutFacet.deploy();
    const diamondLoupeFacet = await DiamondLoupeFacet.deploy();
    const ownershipFacet = await OwnershipFacet.deploy();
    const gasStationFacet = await GasStationFacet.deploy();
    const rewardPollFacet = await RewardPollFacet.deploy();
    const rewardPollProxyFacet = await RewardPollProxyFacet.deploy();
    const withdrawPollFacet = await WithdrawPollFacet.deploy();
    const withdrawPollProxyFacet = await WithdrawPollProxyFacet.deploy();
    const pollProxyFacet = await PollProxyFacet.deploy();

    const diamondCut = [
        {
            action: FacetCutAction.Add,
            facetAddress: assetPoolFacet.address,
            functionSelectors: getSelectors(assetPoolFacet),
        },
        {
            action: FacetCutAction.Add,
            facetAddress: diamondCutFacet.address,
            functionSelectors: getSelectors(diamondCutFacet),
        },
        {
            action: FacetCutAction.Add,
            facetAddress: diamondLoupeFacet.address,
            functionSelectors: getSelectors(diamondLoupeFacet),
        },
        {
            action: FacetCutAction.Add,
            facetAddress: ownershipFacet.address,
            functionSelectors: getSelectors(ownershipFacet),
        },
        {
            action: FacetCutAction.Add,
            facetAddress: gasStationFacet.address,
            functionSelectors: getSelectors(gasStationFacet),
        },
        {
            action: FacetCutAction.Add,
            facetAddress: rewardPollFacet.address,
            functionSelectors: getSelectors(rewardPollFacet),
        },
        {
            action: FacetCutAction.Add,
            facetAddress: rewardPollProxyFacet.address,
            functionSelectors: getSelectors(rewardPollProxyFacet),
        },
        {
            action: FacetCutAction.Add,
            facetAddress: withdrawPollProxyFacet.address,
            functionSelectors: getSelectors(withdrawPollProxyFacet),
        },
        {
            action: FacetCutAction.Add,
            facetAddress: withdrawPollFacet.address,
            functionSelectors: getSelectors(withdrawPollFacet),
        },
        {
            action: FacetCutAction.Add,
            facetAddress: pollProxyFacet.address,
            functionSelectors: getSelectors(pollProxyFacet),
        },
        {
            action: FacetCutAction.Add,
            facetAddress: assetPoolFacetView.address,
            functionSelectors: getSelectors(assetPoolFacetView),
        },
        {
            action: FacetCutAction.Add,
            facetAddress: rolesFacet.address,
            functionSelectors: getSelectors(rolesFacet),
        },
        {
            action: FacetCutAction.Add,
            facetAddress: updateDiamondFacet.address,
            functionSelectors: getSelectors(updateDiamondFacet),
        },
    ];
    let all: any[] = [];
    for (let facet in diamondCut) {
        for (let func in diamondCut[facet].functionSelectors) {
            const elem = diamondCut[facet].functionSelectors[func];
            if (all.includes(elem)) {
                console.error('facet', facet, 'func', elem);
                for (const key of Object.keys(rewardPollFacet.functions)) {
                    console.error(key);
                    console.error(utils.keccak256(utils.toUtf8Bytes(key)).substr(0, 10));
                }
                break;
            }
            all.push(elem);
        }
    }

    return { AssetPoolFactory, diamondCut };
};
