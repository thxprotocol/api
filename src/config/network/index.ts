import { pick } from '@/util';
import { NetworkProvider } from '@/util/network';
import { NETWORK_ENVIRONMENT } from '@/config/secrets';
import * as environmentsConfig from './environments';

export const currentVersion = '1.0.6';

export const ContractAddressConfig = environmentsConfig[NETWORK_ENVIRONMENT];

const facets = ContractAddressConfig[NetworkProvider.Main][0].facets;
const facetConfig: {
    shared: (keyof typeof facets)[];
    bypass: (keyof typeof facets)[];
    active: (keyof typeof facets)[];
} = {
    shared: [
        'AccessControl',
        'MemberAccess',
        'Token',
        'BasePollProxy',
        'GasStationFacet',
        'DiamondCutFacet',
        'DiamondLoupeFacet',
        'OwnershipFacet',
    ],
    bypass: ['RewardBy', 'RewardByPoll', 'RewardByPollProxy', 'WithdrawBy', 'WithdrawByPoll', 'WithdrawByPollProxy'],
    active: ['Withdraw', 'WithdrawPoll', 'WithdrawPollProxy', 'Reward', 'RewardPoll', 'RewardPollProxy'],
};
export const getCurrentAssetPoolFactoryAddress = (npid: NetworkProvider) => {
    return ContractAddressConfig[npid].find((conf: { version: string }) => conf.version === currentVersion)
        .assetPoolFactory;
};

export const getCurrentAssetPoolRegistryAddress = (npid: NetworkProvider) => {
    return ContractAddressConfig[npid].find((conf: { version: string }) => conf.version === currentVersion)
        .assetPoolRegistry;
};

export const getCurrentPoolFacetAdresses = (npid: NetworkProvider, bypassPolls: boolean) => {
    return getPoolFacetAdressesByVersion(npid, currentVersion, bypassPolls);
};
export const getPoolFacetAdressesByVersion = (npid: NetworkProvider, version: string, bypassPolls: boolean) => {
    const facets = ContractAddressConfig[npid].find((conf: { version: string }) => conf.version === version).facets;

    const governancefacets = bypassPolls ? facetConfig.bypass : facetConfig.active;

    return pick(facets, [...governancefacets, ...facetConfig.shared]);
};

export const getPoolFacetAdressesPermutations = (npid: NetworkProvider) => {
    const result = [];
    const versions = ContractAddressConfig[npid].map((config: any) => config.version);
    for (const version of versions) {
        result.push({ version, bypassPolls: true, facets: getPoolFacetAdressesByVersion(npid, version, true), npid });
        result.push({ version, bypassPolls: false, facets: getPoolFacetAdressesByVersion(npid, version, false), npid });
    }

    return result;
};
