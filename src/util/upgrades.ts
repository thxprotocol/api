import { getSelectors, ADDRESS_ZERO } from './network';
import { TransactionService } from '@/services/TransactionService';
import { poolFacetAdresses, poolFacetContracts } from '@/config/contracts';
import { pick, uniq } from '.';
import { Artifacts } from './artifacts';
import { AssetPoolDocument, AssetPoolType } from '@/models/AssetPool';

export enum FacetCutAction {
    Add = 0,
    Replace = 1,
    Remove = 2,
}

function getDiamonCutsFromSelectorsMap(map: Map<string, string>, action: FacetCutAction) {
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

export async function updateAssetPool(pool: AssetPoolDocument, version?: string) {
    const facets = await pool.solution.methods.facets().call();

    const currentSelectorMapping = new Map();
    facets.forEach((facet: any) =>
        facet.functionSelectors.forEach((selector: string) => {
            currentSelectorMapping.set(selector, facet.facetAddress);
        }),
    );

    const newContracts = poolFacetContracts(pool.network, version);
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
            deletions.set(currentSelector[0], currentSelector[1]);
        }
    }

    const diamondCuts = [];

    diamondCuts.push(...getDiamonCutsFromSelectorsMap(replaces, FacetCutAction.Replace));
    diamondCuts.push(...getDiamonCutsFromSelectorsMap(deletions, FacetCutAction.Remove));
    diamondCuts.push(...getDiamonCutsFromSelectorsMap(additions, FacetCutAction.Add));

    await TransactionService.send(
        pool.solution.options.address,
        pool.solution.methods.diamondCut(diamondCuts, ADDRESS_ZERO, '0x'),
        pool.network,
    );
}

export const updateToVersion = async (assetPool: AssetPoolType, version: string) => {
    const addresses = poolFacetAdresses(assetPool.network, version);
    const artifacts = Object.values(pick(Artifacts, Object.keys(addresses) as (keyof typeof Artifacts)[]));
    console.log(artifacts);
};
