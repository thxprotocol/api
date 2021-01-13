const hre = require('hardhat');
const ethers = hre.ethers;
const { utils } = require('ethers/lib');

async function main() {
    FacetCutAction = {
        Add: 0,
        Replace: 1,
        Remove: 2,
    };
    getSelectors = function (contract) {
        const signatures = [];
        for (const key of Object.keys(contract.functions)) {
            signatures.push(utils.keccak256(utils.toUtf8Bytes(key)).substr(0, 10));
        }

        return signatures;
    };

    AssetPoolFacet = await ethers.getContractFactory('AssetPoolFacet');
    AssetPoolFacetView = await ethers.getContractFactory('AssetPoolFacetView');
    RolesFacet = await ethers.getContractFactory('RolesFacet');
    DiamondCutFacet = await ethers.getContractFactory('DiamondCutFacet');
    DiamondLoupeFacet = await ethers.getContractFactory('DiamondLoupeFacet');
    OwnershipFacet = await ethers.getContractFactory('OwnershipFacet');
    GasStationFacet = await ethers.getContractFactory('GasStationFacet');
    RewardPollFacet = await ethers.getContractFactory('RewardPollFacet');
    RewardPollProxyFacet = await ethers.getContractFactory('RewardPollProxyFacet');
    WithdrawPollFacet = await ethers.getContractFactory('WithdrawPollFacet');
    WithdrawPollProxyFacet = await ethers.getContractFactory('WithdrawPollProxyFacet');
    PollProxyFacet = await ethers.getContractFactory('PollProxyFacet');

    UpdateDiamondFacet = await ethers.getContractFactory('UpdateDiamondFacet');
    AssetPoolFactory = await ethers.getContractFactory('AssetPoolFactory');

    assetPoolFacet = await AssetPoolFacet.deploy();
    updateDiamondFacet = await UpdateDiamondFacet.deploy();
    assetPoolFacetView = await AssetPoolFacetView.deploy();
    rolesFacet = await RolesFacet.deploy();
    diamondCutFacet = await DiamondCutFacet.deploy();
    diamondLoupeFacet = await DiamondLoupeFacet.deploy();
    ownershipFacet = await OwnershipFacet.deploy();
    gasStationFacet = await GasStationFacet.deploy();
    rewardPollFacet = await RewardPollFacet.deploy();
    rewardPollProxyFacet = await RewardPollProxyFacet.deploy();
    withdrawPollFacet = await WithdrawPollFacet.deploy();
    withdrawPollProxyFacet = await WithdrawPollProxyFacet.deploy();
    pollProxyFacet = await PollProxyFacet.deploy();

    diamondCut = [
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
    all = [];
    for (facet in diamondCut) {
        for (func in diamondCut[facet].functionSelectors) {
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
    const diamond = await AssetPoolFactory.deploy(diamondCut);

    await diamond.deployed();

    console.log('Diamond Address:', diamond.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
