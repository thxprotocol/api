import { NetworkProvider } from '@/types/enums';
import { getProvider } from '@/util/network';
import { AbiItem } from 'web3-utils';
import {
    availableVersions,
    contractConfig,
    ContractName,
    diamondAbi,
    diamondFacetConfigs,
    diamondFacetNames,
    DiamondVariant,
    diamondVariants,
    TNetworkName,
} from '@thxnetwork/artifacts';
import { MAINNET_NETWORK_NAME, TESTNET_NETWORK_NAME } from './secrets';

export const getContractConfig = (
    npid: NetworkProvider,
    contractName: ContractName,
    version?: string,
): { address: string; abi: AbiItem[] } => {
    return contractConfig(npToName(npid), contractName, version);
};

export const getDiamondAbi = (npid: NetworkProvider, variant: DiamondVariant) => {
    return diamondAbi(npToName(npid), variant);
};

export const getContract = (npid: NetworkProvider, contractName: ContractName, version?: string) => {
    const contractConfig = getContractConfig(npid, contractName, version);
    const { web3 } = getProvider(npid);
    return new web3.eth.Contract(contractConfig.abi, contractConfig.address);
};

export const diamondContracts = (npid: NetworkProvider, variant: DiamondVariant, version?: string) => {
    const result = [];
    const { web3 } = getProvider(npid);

    for (const contractConfig of Object.values(diamondFacetConfigs(npToName(npid), variant, version))) {
        result.push(new web3.eth.Contract(contractConfig.abi, contractConfig.address));
    }

    return result;
};

export const diamondFacetAddresses = (npid: NetworkProvider, variant: DiamondVariant, version?: string) => {
    const result: { [key in ContractName]?: string } = {};

    for (const [name, contractConfig] of Object.entries(diamondFacetConfigs(npToName(npid), variant, version))) {
        result[name as ContractName] = contractConfig.address;
    }

    return result;
};

export const poolFacetAdressesPermutations = (npid: NetworkProvider) => {
    const result = [];
    const versions = availableVersions(npToName(npid));
    for (const version of versions) {
        for (const variant of diamondVariants) {
            const facetAddresses = diamondFacetNames(variant)
                .filter((name) => !['DiamondCutFacet', 'DiamondLoupeFacet', 'OwnershipFacet'].includes(name))
                .map((contractName) => getContractConfig(npid, contractName, version).address);
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
