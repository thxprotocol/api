import { getSelectors, ADDRESS_ZERO } from './network';
import TransactionService from '@/services/TransactionService';
import { Contract } from 'web3-eth-contract';
import { uniq } from '.';
import { AssetPoolDocument } from '@/models/AssetPool';
import { NetworkProvider } from '@/types/enums';
import { diamondContracts, getContract } from '@/config/contracts';
import { DiamondVariant } from '@thxnetwork/artifacts';

export enum FacetCutAction {
    Add = 0,
    Replace = 1,
    Remove = 2,
}

function getDiamondCutsFromSelectorsMap(map: Map<string, string>, action: FacetCutAction) {
    const result = [];
    for (const facetAddress of uniq([...map.values()])) {
        result.push({
            facetAddress,
            action: action,
            functionSelectors: [...map].filter(([, address]) => facetAddress === address).map(([selector]) => selector),
        });
    }
    return result;
}

function getDiamondCutForContractFacets(newContracts: Contract[], facets: any[]) {
    const currentSelectorMapping = new Map();
    facets.forEach((facet: any) =>
        facet.functionSelectors.forEach((selector: string) => {
            currentSelectorMapping.set(selector, facet.facetAddress);
        }),
    );

    const additions = new Map();
    for (const contract of newContracts) {
        getSelectors(contract).forEach((selector: string) => {
            additions.set(selector, contract.options.address);
        });
    }

    const replaces = new Map();
    const deletions = new Map();

    for (const currentSelector of currentSelectorMapping) {
        if (additions.has(currentSelector[0])) {
            // If the selector address has changed in the new version.
            if (additions.get(currentSelector[0]) !== currentSelector[1]) {
                replaces.set(currentSelector[0], additions.get(currentSelector[0]));
            }
            // The selector already exists so it's not an addition.
            additions.delete(currentSelector[0]);
        } else {
            // The selector doesn't exist in the new contracts anymore, remove it.
            deletions.set(currentSelector[0], ADDRESS_ZERO);
        }
    }

    const diamondCuts = [];

    diamondCuts.push(...getDiamondCutsFromSelectorsMap(replaces, FacetCutAction.Replace));
    diamondCuts.push(...getDiamondCutsFromSelectorsMap(deletions, FacetCutAction.Remove));
    diamondCuts.push(...getDiamondCutsFromSelectorsMap(additions, FacetCutAction.Add));

    return diamondCuts;
}

export async function updateAssetPool(pool: AssetPoolDocument, version?: string) {
    const tx = await updateDiamondContract(pool.network, pool.contract, 'defaultPool', version);

    pool.version = version;
    await pool.save();

    return tx;
}

export async function updateAssetPoolFactory(npid: NetworkProvider, version?: string) {
    const factory = getContract(npid, 'AssetPoolFactory');
    return await updateDiamondContract(npid, factory, 'assetPoolFactory', version);
}

export const updateDiamondContract = async (
    npid: NetworkProvider,
    contract: Contract,
    variant: DiamondVariant,
    version?: string,
) => {
    const facets = await contract.methods.facets().call();
    const newContracts = diamondContracts(npid, variant, version);
    const diamondCuts = getDiamondCutForContractFacets(newContracts, facets);

    if (diamondCuts.length > 0) {
        return await TransactionService.send(
            contract.options.address,
            contract.methods.diamondCut(diamondCuts, ADDRESS_ZERO, '0x'),
            npid,
        );
    }
};
