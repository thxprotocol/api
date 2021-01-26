import hre from 'hardhat';
import { Contract, utils } from 'ethers/lib';

const ethers = hre.ethers;

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

    const AssetPoolFacet = await ethers.getContractFactory('AssetPoolFacet');
    const AssetPoolFacetView = await ethers.getContractFactory('AssetPoolFacetView');
    const RolesFacet = await ethers.getContractFactory('RolesFacet');
    const DiamondCutFacet = await ethers.getContractFactory('DiamondCutFacet');
    const DiamondLoupeFacet = await ethers.getContractFactory('DiamondLoupeFacet');
    const OwnershipFacet = await ethers.getContractFactory('OwnershipFacet');
    const GasStationFacet = await ethers.getContractFactory('GasStationFacet');
    const RewardPollFacet = await ethers.getContractFactory('RewardPollFacet');
    const RewardPollProxyFacet = await ethers.getContractFactory('RewardPollProxyFacet');
    const WithdrawPollFacet = await ethers.getContractFactory('WithdrawPollFacet');
    const WithdrawPollProxyFacet = await ethers.getContractFactory('WithdrawPollProxyFacet');
    const PollProxyFacet = await ethers.getContractFactory('PollProxyFacet');

    const UpdateDiamondFacet = await ethers.getContractFactory('UpdateDiamondFacet');
    const AssetPoolFactory = await ethers.getContractFactory('AssetPoolFactory');

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
