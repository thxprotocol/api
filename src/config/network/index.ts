import { pick } from '@/util';
import { NetworkProvider } from '@/types/enums';
import { NETWORK_ENVIRONMENT } from '@/config/secrets';
import * as environmentsConfig from './environments';

export const currentVersion = '1.0.6';

export const ContractAddressConfig = environmentsConfig[NETWORK_ENVIRONMENT];

const facets = ContractAddressConfig[NetworkProvider.Main][0].facets;
const poolFacets: (keyof typeof facets)[] = [
    'AccessControl',
    'MemberAccess',
    'Token',
    'BasePollProxy',
    'GasStationFacet',
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
    return ContractAddressConfig[npid].find((conf: { version: string }) => conf.version === version || currentVersion)
        .assetPoolFactory;
};
export const assetPoolRegistryAddress = (npid: NetworkProvider, version?: string) => {
    return ContractAddressConfig[npid].find((conf: { version: string }) => conf.version === version || currentVersion)
        .assetPoolRegistry;
};

export const facetAdresses = (npid: NetworkProvider, version?: string) => {
    return ContractAddressConfig[npid].find((conf: { version: string }) => conf.version === version || currentVersion)
        .facets;
};

export const poolFacetAdresses = (npid: NetworkProvider, version: string) => {
    const facets = ContractAddressConfig[npid].find(
        (conf: { version: string }) => conf.version === version || currentVersion,
    ).facets;

    return pick(facets, poolFacets);
};

export const poolFacetAdressesPermutations = (npid: NetworkProvider) => {
    const result = [];
    const versions = ContractAddressConfig[npid].map((config: any) => config.version);
    for (const version of versions) {
        result.push({ version, facets: poolFacetAdresses(npid, version), npid });
    }

    return result;
};
