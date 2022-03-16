import { NetworkProvider } from '@/types/enums';
import { getProvider, getSelectors } from '@/util/network';
import { FacetCutAction } from '@/util/upgrades';
import { AbiItem } from 'web3-utils';
import { uniq } from '@/util';
import { availableVersions, contractConfig, TNetworkName } from '@thxnetwork/artifacts';
import { MAINNET_NETWORK_NAME, TESTNET_NETWORK_NAME } from './secrets';

const facetVariants = {
    defaultPool: [
        'AccessControl',
        'MemberAccess',
        'Token',
        'BasePollProxy',
        'RelayHubFacet',
        'WithdrawBy',
        'WithdrawByPoll',
        'WithdrawByPollProxy',
    ],
    defaultPoolFactory: ['AssetPoolFactoryFacet'],
};

export const getContractConfig = (
    npid: NetworkProvider,
    contractName: string,
    version?: string,
): { address: string; abi: AbiItem[] } => {
    return contractConfig(npToName(npid), contractName, version);
};

export const getContract = (npid: NetworkProvider, contractName: string, version?: string) => {
    const contractConfig = getContractConfig(npid, contractName, version);
    const { web3 } = getProvider(npid);
    return new web3.eth.Contract(contractConfig.abi, contractConfig.address);
};

const diamonContractNames = (variant: keyof typeof facetVariants) => {
    return [...facetVariants[variant], 'DiamondCutFacet', 'DiamondLoupeFacet', 'OwnershipFacet'];
};

export const diamondContracts = (npid: NetworkProvider, variant: keyof typeof facetVariants, version?: string) => {
    const result = [];
    const { web3 } = getProvider(npid);

    for (const contractName of diamonContractNames(variant)) {
        const contractConfig = getContractConfig(npid, contractName, version);
        result.push(new web3.eth.Contract(contractConfig.abi, contractConfig.address));
    }

    return result;
};

export const diamondAbi = (npid: NetworkProvider, variant: keyof typeof facetVariants, version?: string): AbiItem[] => {
    const result: AbiItem[] = [];

    for (const contractName of diamonContractNames(variant)) {
        const abi = getContractConfig(npid, contractName, version).abi;
        for (const abiItem of abi) {
            if (!result.find((item) => item.type == abiItem.type && item.name == abiItem.name)) result.push(abiItem);
        }
    }

    return uniq(result);
};

export const diamondCut = (npid: NetworkProvider) => {
    const diamondCut = [];
    for (const f of diamondContracts(npid, 'defaultPool')) {
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
    const versions = availableVersions(npToName(npid));
    for (const version of versions) {
        for (const variant of Object.keys(facetVariants) as any) {
            const facetAddresses = diamonContractNames(variant).map(
                (contractName) => getContractConfig(npid, contractName, version).address,
            );
            result.push({ version, variant, facetAddresses, npid });
        }
    }

    return result;
};

const npToName = (npid: NetworkProvider): TNetworkName => {
    switch (npid) {
        case NetworkProvider.Main:
            return MAINNET_NETWORK_NAME as TNetworkName;
        case NetworkProvider.Test:
            return TESTNET_NETWORK_NAME as TNetworkName;
    }
};
