import { pick } from '@/util';
import { NetworkProvider } from '@/types/enums';
import { NETWORK_ENVIRONMENT } from '@/config/secrets';
import * as environmentsConfig from './environments';
import { getProvider, getSelectors } from '@/util/network';
import { Artifacts, ArtifactsKey } from '@/config/contracts/artifacts';
import { FacetCutAction } from '@/util/upgrades';

export const currentVersion = '1.0.8';

const contractAddressConfig = environmentsConfig[NETWORK_ENVIRONMENT];

const poolFacets: ArtifactsKey[] = [
    'AccessControl',
    'MemberAccess',
    'Token',
    'BasePollProxy',
    'RelayHub',
    'DiamondCutFacet',
    'DiamondLoupeFacet',
    'OwnershipFacet',
    'RewardBy',
    'RewardByPoll',
    'RewardByPollProxy',
    'WithdrawBy',
    'WithdrawByPoll',
    'WithdrawByPollProxy',
];

export const assetPoolFactoryAddress = (npid: NetworkProvider, version?: string) => {
    return contractAddressConfig[npid].find((conf: { version: string }) => conf.version === (version || currentVersion))
        .assetPoolFactory;
};
export const assetPoolRegistryAddress = (npid: NetworkProvider, version?: string) => {
    return contractAddressConfig[npid].find((conf: { version: string }) => conf.version === (version || currentVersion))
        .assetPoolRegistry;
};

export const facetAdresses = (npid: NetworkProvider, version?: string) => {
    return contractAddressConfig[npid].find((conf: { version: string }) => conf.version === (version || currentVersion))
        .facets;
};

export const poolFacetAdresses = (npid: NetworkProvider, version?: string): { [key in ArtifactsKey]?: string } => {
    const facets = facetAdresses(npid, version);

    return pick(facets, poolFacets);
};

export const poolFacetContracts = (npid: NetworkProvider, version?: string) => {
    const addresses = poolFacetAdresses(npid, version);
    const { web3 } = getProvider(npid);

    return Object.entries(addresses).map(([name, address]: [ArtifactsKey, string]) => {
        return new web3.eth.Contract((Artifacts[name] as any).abi, address);
    });
};

export const diamondCut = (npid: NetworkProvider) => {
    const diamondCut = [];
    for (const f of poolFacetContracts(npid, currentVersion)) {
        diamondCut.push({
            action: FacetCutAction.Add,
            facetAddress: f.options.address,
            functionSelectors: getSelectors(f),
        });
    }
    return diamondCut;
};

export const poolFacetAdressesPermutations = (npid: NetworkProvider) => {
    const result = [];
    const versions = contractAddressConfig[npid].map((config: any) => config.version);
    for (const version of versions) {
        result.push({ version, facets: poolFacetAdresses(npid, version), npid });
    }

    return result;
};
