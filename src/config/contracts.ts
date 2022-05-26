import { NetworkProvider } from '@/types/enums';
import { getProvider } from '@/util/network';
import { AbiItem } from 'web3-utils';
import { Contract } from 'web3-eth-contract';
import * as semver from 'semver';
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

export const getContractFromAbi = (npid: NetworkProvider, abi: AbiItem[], address: string): Contract => {
    const { web3 } = getProvider(npid);
    return new web3.eth.Contract(abi, address);
};

export const getAbiForContractName = (contractName: ContractName): AbiItem[] => {
    // We are requiring the abi file here since the network specific exports only hold diamond related contracts
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require(`@thxnetwork/artifacts/dist/exports/abis/${contractName}.json`);
};

export const getContractFromName = (npid: NetworkProvider, contractName: ContractName, address: string) => {
    return getContractFromAbi(npid, getAbiForContractName(contractName), address);
};

export const getDiamondAbi = (npid: NetworkProvider, variant: DiamondVariant) => {
    return diamondAbi(npToName(npid), variant);
};

export const getContract = (npid: NetworkProvider, contractName: ContractName, version?: string) => {
    return getContractFromName(npid, contractName, getContractConfig(npid, contractName, version).address);
};

export const diamondContracts = (npid: NetworkProvider, variant: DiamondVariant, version?: string) => {
    const result = [];
    const { web3 } = getProvider(npid);
    const facetConfigs = diamondFacetConfigs(npToName(npid), variant, version);

    for (const key in facetConfigs) {
        const contractName = key as ContractName;
        const contractConfig = facetConfigs[contractName];
        // Reading abis from exports folder since network deployment abi's are not up to date when factories
        // require an update during the CI run. Still fetching the address from the contractConfig.
        result.push(new web3.eth.Contract(getAbiForContractName(contractName), contractConfig.address));
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
    const versions = semver.rsort(availableVersions(npToName(npid)));
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
