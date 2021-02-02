import dotenv from 'dotenv';

import { Contract, ContractFactory, ethers, utils } from 'ethers/lib';

import AssetPoolFacetArtifact from '../src/artifacts/contracts/contracts/facets/AssetPoolFacet/AssetPoolFacet.sol/AssetPoolFacet.json';
import AssetPoolFacetViewArtifact from '../src/artifacts/contracts/contracts/facets/AssetPoolFacet/AssetPoolFacetView.sol/AssetPoolFacetView.json';
import RolesFacetArtifact from '../src/artifacts/contracts/contracts/facets/RolesFacet/RolesFacet.sol/RolesFacet.json';
import DiamondCutFacetArtifact from '../src/artifacts/diamond-2/contracts/facets/DiamondCutFacet.sol/DiamondCutFacet.json';
import DiamondLoupeFacetArtifact from '../src/artifacts/diamond-2/contracts/facets/DiamondLoupeFacet.sol/DiamondLoupeFacet.json';
import OwnershipFacetArtifact from '../src/artifacts/diamond-2/contracts/facets/OwnershipFacet.sol/OwnershipFacet.json';
import GasStationFacetArtifact from '../src/artifacts/contracts/contracts/facets/GasStationFacet/GasStation.sol/GasStationFacet.json';
import RewardPollFacetArtifact from '../src/artifacts/contracts/contracts/facets/PollFacet/RewardPollFacet.sol/RewardPollFacet.json';
import RewardPollProxyFacetArtifact from '../src/artifacts/contracts/contracts/facets/PollFacet/RewardPollProxyFacet.sol/RewardPollProxyFacet.json';
import WithdrawPollFacetArtifact from '../src/artifacts/contracts/contracts/facets/PollFacet/WithdrawPollFacet.sol/WithdrawPollFacet.json';
import WithdrawPollProxyFacetArtifact from '../src/artifacts/contracts/contracts/facets/PollFacet/WithdrawPollProxyFacet.sol/WithdrawPollProxyFacet.json';
import PollProxyFacetArtifact from '../src/artifacts/contracts/contracts/facets/PollFacet/PollProxyFacet.sol/PollProxyFacet.json';
import UpdateDiamondFacetArtifact from '../src/artifacts/contracts/contracts/factories/UpdateDiamondFacet.sol/UpdateDiamondFacet.json';
import AssetPoolFactoryArtifact from '../src/artifacts/contracts/contracts/factories/AssetPoolFactory.sol/AssetPoolFactory.json';

const env = process.env.NODE_ENV;

if (env) {
    dotenv.config({ path: `.env.${env === 'test' ? 'example' : env}` });
} else {
    dotenv.config({ path: '.env' });
}

const provider = new ethers.providers.JsonRpcProvider(process.env.PUBLIC_RPC);
const admin = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

async function main() {
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

    const AssetPoolFacet = new ContractFactory(AssetPoolFacetArtifact.abi, AssetPoolFacetArtifact.bytecode, admin);
    const AssetPoolFacetView = new ContractFactory(
        AssetPoolFacetViewArtifact.abi,
        AssetPoolFacetViewArtifact.bytecode,
        admin,
    );
    const RolesFacet = new ContractFactory(RolesFacetArtifact.abi, RolesFacetArtifact.bytecode, admin);
    const DiamondCutFacet = new ContractFactory(DiamondCutFacetArtifact.abi, DiamondCutFacetArtifact.bytecode, admin);
    const DiamondLoupeFacet = new ContractFactory(
        DiamondLoupeFacetArtifact.abi,
        DiamondLoupeFacetArtifact.bytecode,
        admin,
    );
    const OwnershipFacet = new ContractFactory(OwnershipFacetArtifact.abi, OwnershipFacetArtifact.bytecode, admin);
    const GasStationFacet = new ContractFactory(GasStationFacetArtifact.abi, GasStationFacetArtifact.bytecode, admin);
    const RewardPollFacet = new ContractFactory(RewardPollFacetArtifact.abi, RewardPollFacetArtifact.bytecode, admin);
    const RewardPollProxyFacet = new ContractFactory(
        RewardPollProxyFacetArtifact.abi,
        RewardPollProxyFacetArtifact.bytecode,
        admin,
    );
    const WithdrawPollFacet = new ContractFactory(
        WithdrawPollFacetArtifact.abi,
        WithdrawPollFacetArtifact.bytecode,
        admin,
    );
    const WithdrawPollProxyFacet = new ContractFactory(
        WithdrawPollProxyFacetArtifact.abi,
        WithdrawPollProxyFacetArtifact.bytecode,
        admin,
    );
    const PollProxyFacet = new ContractFactory(PollProxyFacetArtifact.abi, PollProxyFacetArtifact.bytecode, admin);
    const UpdateDiamondFacet = new ContractFactory(
        UpdateDiamondFacetArtifact.abi,
        UpdateDiamondFacetArtifact.bytecode,
        admin,
    );
    const AssetPoolFactory = new ContractFactory(
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
    const all: any = [];
    for (const facet in diamondCut) {
        for (const func in diamondCut[facet].functionSelectors) {
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
    const factory = await AssetPoolFactory.deploy(diamondCut);

    await factory.deployed();

    console.log('Asset Pool Factory Address:', factory.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
