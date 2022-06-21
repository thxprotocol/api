import { ChainId } from '@/types/enums';
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
import { HARDHAT_NAME, POLYGON_MUMBAI_NAME, POLYGON_NAME } from './secrets';

export const getContractConfig = (
    chainId: ChainId,
    contractName: ContractName,
    version?: string,
): { address: string; abi: AbiItem[] } => {
    return contractConfig(chainIdToName(chainId), contractName, version);
};

export const getContractFromAbi = (chainId: ChainId, abi: AbiItem[], address: string): Contract => {
    const { web3 } = getProvider(chainId);
    return new web3.eth.Contract(abi, address);
};

export const getAbiForContractName = (contractName: ContractName): AbiItem[] => {
    // We are requiring the abi file here since the network specific exports only hold diamond related contracts
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require(`@thxnetwork/artifacts/dist/exports/abis/${contractName}.json`);
};

export const getContractFromName = (chainId: ChainId, contractName: ContractName, address: string) => {
    return getContractFromAbi(chainId, getAbiForContractName(contractName), address);
};

export const getDiamondAbi = (chainId: ChainId, variant: DiamondVariant) => {
    return diamondAbi(chainIdToName(chainId), variant);
};

export const getContract = (chainId: ChainId, contractName: ContractName, version?: string) => {
    return getContractFromName(chainId, contractName, getContractConfig(chainId, contractName, version).address);
};

export const diamondContracts = (chainId: ChainId, variant: DiamondVariant, version?: string) => {
    const result = [];
    const facetConfigs = diamondFacetConfigs(chainIdToName(chainId), variant, version);

    for (const key in facetConfigs) {
        const contractName = key as ContractName;
        const contractConfig = facetConfigs[contractName];
        // Reading abis from exports folder since network deployment abi's are not up to date when factories
        // require an update during the CI run. Still fetching the address from the contractConfig.
        result.push(getContractFromName(chainId, contractName, contractConfig.address));
    }

    return result;
};

export const diamondFacetAddresses = (chainId: ChainId, variant: DiamondVariant, version?: string) => {
    const result: { [key in ContractName]?: string } = {};

    for (const [name, contractConfig] of Object.entries(
        diamondFacetConfigs(chainIdToName(chainId), variant, version),
    )) {
        result[name as ContractName] = contractConfig.address;
    }

    return result;
};

export const poolFacetAdressesPermutations = (chainId: ChainId) => {
    const result = [];
    const versions = semver.rsort(availableVersions(chainIdToName(chainId)));
    for (const version of versions) {
        for (const variant of diamondVariants) {
            const facetAddresses = diamondFacetNames(variant)
                .filter((name) => !['DiamondCutFacet', 'DiamondLoupeFacet', 'OwnershipFacet'].includes(name))
                .map((contractName) => getContractConfig(chainId, contractName, version).address);
            result.push({ version, variant, facetAddresses, chainId });
        }
    }

    return result;
};

const chainIdToName = (chainId: ChainId): TNetworkName => {
    switch (chainId) {
        case ChainId.Polygon:
            return POLYGON_NAME as TNetworkName;
        case ChainId.PolygonMumbai:
            return POLYGON_MUMBAI_NAME as TNetworkName;
        case ChainId.Hardhat:
            return HARDHAT_NAME as TNetworkName;
    }
};
