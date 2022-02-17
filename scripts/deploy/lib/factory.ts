import { deployContract, getProvider, getSelectors, NetworkProvider, sendTransaction } from '../../../src/util/network';
import { FacetCutAction } from '../../../src/util/upgrades';
import { Artifacts } from '../../../src/util/artifacts';
import { Facets } from '../../../src/util/facets';

export async function deployFactory(npid: NetworkProvider) {
    const { web3, admin } = getProvider(npid);
    let defaultDiamond: any[] = [
        Artifacts.AccessControl,
        Artifacts.MemberAccess,
        Artifacts.Token,
        Artifacts.BasePollProxy,
        Artifacts.GasStationFacet,
        Artifacts.WithdrawBy,
        Artifacts.WithdrawByPoll,
        Artifacts.WithdrawByPollProxy,
        Artifacts.RewardBy,
        Artifacts.RewardByPoll,
        Artifacts.RewardByPollProxy,
        Artifacts.DiamondCutFacet,
        Artifacts.DiamondLoupeFacet,
        Artifacts.OwnershipFacet,
    ];
    let factoryDiamond: any[] = [
        Artifacts.DiamondCutFacet,
        Artifacts.DiamondLoupeFacet,
        Artifacts.OwnershipFacet,
        Artifacts.AssetPoolFactoryFacet,
    ];

    defaultDiamond = defaultDiamond.map((artifact) => {
        const facetAddress = Facets[NetworkProvider[npid]][artifact.contractName];
        const facet = new web3.eth.Contract(artifact.abi, facetAddress);

        return {
            action: FacetCutAction.Add,
            facetAddress,
            functionSelectors: getSelectors(facet),
        };
    });

    factoryDiamond = factoryDiamond.map((artifact) => {
        const facetAddress = Facets[NetworkProvider[npid]][artifact.contractName];
        const facet = new web3.eth.Contract(artifact.abi, facetAddress);

        return {
            action: FacetCutAction.Add,
            facetAddress,
            functionSelectors: getSelectors(facet),
        };
    });
    const diamond = await deployContract(
        Artifacts.Diamond.abi,
        Artifacts.Diamond.bytecode,
        [factoryDiamond, [admin.address]],
        npid,
    );
    const abi: any = Artifacts.IAssetPoolFactory.abi;
    const factory = new web3.eth.Contract(abi, diamond.options.address);

    await sendTransaction(factory.options.address, factory.methods.initialize(defaultDiamond), npid);

    return factory.options.address;
}
