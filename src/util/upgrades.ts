import { getSelectors, NetworkProvider, sendTransaction, getProvider, ADDRESS_ZERO } from './network';
import { Contract } from 'web3-eth-contract';
import { Artifacts } from './artifacts';
import { Facets } from './facets';
import { IAssetPool } from '../models/AssetPool';

export const FacetCutAction = {
    Add: 0,
    Replace: 1,
    Remove: 2,
};

export async function updateAssetPool(artifacts: any, solution: Contract, npid: NetworkProvider) {
    const web3 = getProvider(npid);

    const diamondCuts = [];
    for (const artifact of artifacts) {
        const facetAddress = Facets[NetworkProvider[npid]][artifact.contractName];
        const facet = new web3.eth.Contract(artifact.abi);
        const functionSelectors = getSelectors(facet);

        diamondCuts.push({
            facetAddress,
            action: FacetCutAction.Replace,
            functionSelectors,
        });
    }
    return await sendTransaction(
        solution.options.address,
        solution.methods.diamondCut(diamondCuts, ADDRESS_ZERO, '0x'),
        npid,
    );
}

export const downgradeFromBypassPolls = async (assetPool: IAssetPool) => {
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

export const updateToBypassPolls = async (assetPool: IAssetPool) => {
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
