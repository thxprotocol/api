import { getSelectors, getProvider, ADDRESS_ZERO } from './network';
import { NetworkProvider } from '../types/enums';
import { Contract } from 'web3-eth-contract';
import { TransactionService } from '@/services/TransactionService';
import { facetAdresses, poolFacetAdresses } from '@/config/contracts';
import { pick } from '.';
import { Artifacts } from './artifacts';
import { AssetPoolType } from '@/models/AssetPool';

export const FacetCutAction = {
    Add: 0,
    Replace: 1,
    Remove: 2,
};

export async function updateAssetPool(artifacts: any, solution: Contract, npid: NetworkProvider) {
    const { web3 } = getProvider(npid);

    const diamondCuts = [];
    for (const artifact of artifacts) {
        const addresses = facetAdresses(npid);
        const facetAddress = addresses[artifact.contractName as keyof typeof addresses];
        const facet = new web3.eth.Contract(artifact.abi);
        const functionSelectors = getSelectors(facet);

        diamondCuts.push({
            facetAddress,
            action: FacetCutAction.Replace,
            functionSelectors,
        });
    }
    return await TransactionService.send(
        solution.options.address,
        solution.methods.diamondCut(diamondCuts, ADDRESS_ZERO, '0x'),
        npid,
    );
}

export const updateToVersion = async (assetPool: AssetPoolType, version: string) => {
    const addresses = poolFacetAdresses(assetPool.network, version);
    const artifacts = Object.values(pick(Artifacts, Object.keys(addresses) as (keyof typeof Artifacts)[]));
    console.log(artifacts);
};
