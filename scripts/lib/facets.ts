import { deployContract, NetworkProvider } from '@/util/network';
import { Artifacts } from '@/util/artifacts';

export async function deployFacets(npid: NetworkProvider) {
    const artifacts = [
        Artifacts.AccessControl,
        Artifacts.MemberAccess,
        Artifacts.Token,
        Artifacts.BasePollProxy,
        Artifacts.GasStationFacet,
        Artifacts.UpdateDiamond,
        Artifacts.Withdraw,
        Artifacts.WithdrawPoll,
        Artifacts.WithdrawPollProxy,
        Artifacts.Reward,
        Artifacts.RewardPoll,
        Artifacts.RewardPollProxy,
        Artifacts.WithdrawBy,
        Artifacts.WithdrawByPoll,
        Artifacts.WithdrawByPollProxy,
        Artifacts.RewardBy,
        Artifacts.RewardByPoll,
        Artifacts.RewardByPollProxy,
        Artifacts.DiamondCutFacet,
        Artifacts.DiamondLoupeFacet,
        Artifacts.OwnershipFacet,
        Artifacts.AssetPoolFactoryFacet,
    ];
    const facets: any = {};

    for (const artifact of artifacts) {
        const facet = await deployContract(artifact.abi, artifact.bytecode, [], npid);
        facets[artifact.contractName] = facet.options.address;
    }

    return facets;
}
