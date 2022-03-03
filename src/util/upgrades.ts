import { getSelectors, getProvider, ADDRESS_ZERO } from './network';
import { NetworkProvider } from '../types/enums';
import { Contract } from 'web3-eth-contract';
import { Artifacts } from './artifacts';
import { AssetPoolType } from '@/models/AssetPool';
import { TransactionService } from '@/services/TransactionService';
import { getCurrentFacetAdresses, getPoolFacetAdressesByVersion } from '@/config/network';
import { pick } from '.';

export const FacetCutAction = {
    Add: 0,
    Replace: 1,
    Remove: 2,
};

export async function updateAssetPool(artifacts: any, solution: Contract, npid: NetworkProvider) {
    const { web3 } = getProvider(npid);

    const diamondCuts = [];
    for (const artifact of artifacts) {
        const addresses = getCurrentFacetAdresses(npid);
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

export const downgradeFromBypassPolls = async (assetPool: AssetPoolType) => {
    return await updateAssetPool(
        [
            Artifacts.Withdraw,
            Artifacts.WithdrawPoll,
            Artifacts.WithdrawPollProxy,
            Artifacts.Reward,
            Artifacts.RewardPoll,
            Artifacts.RewardPollProxy,
        ],
        assetPool.solution,
        assetPool.network,
    );
};

export const updateToBypassPolls = async (assetPool: AssetPoolType) => {
    return await updateAssetPool(
        [
            Artifacts.WithdrawBy,
            Artifacts.WithdrawByPoll,
            Artifacts.WithdrawByPollProxy,
            Artifacts.RewardBy,
            Artifacts.RewardByPoll,
            Artifacts.RewardByPollProxy,
        ],
        assetPool.solution,
        assetPool.network,
    );
};

export const updateToVersion = async (assetPool: AssetPoolType, version: string) => {
    const addresses = getPoolFacetAdressesByVersion(assetPool.network, assetPool.bypassPolls, version);
    const artifacts = Object.values(pick(Artifacts, Object.keys(addresses) as (keyof typeof Artifacts)[]));
    console.log(artifacts);
};
