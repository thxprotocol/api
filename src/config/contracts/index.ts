import { NetworkProvider } from '@/types/enums';
import { getProvider, getSelectors } from '@/util/network';
import artifacts from '@/config/contracts/artifacts';
import { FacetCutAction } from '@/util/upgrades';
import { AbiItem } from 'web3-utils';
import { uniq } from '@/util';

export const currentVersion = '1.0.8';

const facetConfigurations = {
    diamond: ['DiamondCutFacet', 'DiamondLoupeFacet', 'OwnershipFacet'],
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
    const contractConfig = artifacts.contracts[contractName as keyof typeof artifacts.contracts] as any;
    return contractConfig;
};

export const getContract = (npid: NetworkProvider, contractName: string, version?: string) => {
    const contractConfig = getContractConfig(npid, contractName, version);
    const { web3 } = getProvider(npid);
    return new web3.eth.Contract(contractConfig.abi, contractConfig.address);
};

export const assetPoolFactoryAddress = (npid: NetworkProvider, version?: string) => {
    return getContractConfig(npid, 'IAssetPoolFactory', version).address;
};

export const assetPoolRegistryAddress = (npid: NetworkProvider, version?: string) => {
    return getContractConfig(npid, 'PoolRegistry', version).address;
};

const diamonContractNames = (configuration: keyof typeof facetConfigurations) => {
    return [...facetConfigurations[configuration], ...facetConfigurations.diamond];
};

export const diamondContracts = (
    npid: NetworkProvider,
    configuration: keyof typeof facetConfigurations,
    version?: string,
) => {
    const result = [];
    const { web3 } = getProvider(npid);

    for (const contractName of diamonContractNames(configuration)) {
        const contractConfig = getContractConfig(npid, contractName, version);
        result.push(new web3.eth.Contract(contractConfig.abi, contractConfig.address));
    }

    return result;
};

export const diamondAbi = (
    npid: NetworkProvider,
    configuration: keyof typeof facetConfigurations,
    version?: string,
): AbiItem[] => {
    const result: AbiItem[] = [];

    for (const contractName of diamonContractNames(configuration)) {
        const abi = getContractConfig(npid, contractName, version).abi;
        for (const abiItem of abi) {
            if (!result.find((item) => item.type == abiItem.type && item.name == abiItem.name)) result.push(abiItem);
        }
    }

    return uniq(result);
};

export const diamondCut = (npid: NetworkProvider) => {
    const diamondCut = [];
    for (const f of diamondContracts(npid, 'defaultPool', currentVersion)) {
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
    // const versions = contractAddressConfig[npid].map((config: any) => config.version);
    // for (const version of versions) {
    // }
    result.push({ version: '1.0.9', facetAddresses: ['fdsa'], npid });

    return result;
};
