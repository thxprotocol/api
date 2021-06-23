import WithdrawArtifact from '../../src/artifacts/contracts/contracts/05-Withdraw/Withdraw.sol/Withdraw.json';
import WithdrawPollArtifact from '../../src/artifacts/contracts/contracts/05-Withdraw/WithdrawPoll.sol/WithdrawPoll.json';
import WithdrawPollProxyArtifact from '../../src/artifacts/contracts/contracts/05-Withdraw/WithdrawPollProxy.sol/WithdrawPollProxy.json';

import RewardArtifact from '../../src/artifacts/contracts/contracts/06-Reward/Reward.sol/Reward.json';
import RewardPollArtifact from '../../src/artifacts/contracts/contracts/06-Reward/RewardPoll.sol/RewardPoll.json';
import RewardPollProxyArtifact from '../../src/artifacts/contracts/contracts/06-Reward/RewardPollProxy.sol/RewardPollProxy.json';

import WithdrawByArtifact from '../../src/artifacts/contracts/contracts/09-WithdrawBypass/WithdrawBy.sol/WithdrawBy.json';
import WithdrawByPollArtifact from '../../src/artifacts/contracts/contracts/09-WithdrawBypass/WithdrawByPoll.sol/WithdrawByPoll.json';
import WithdrawByPollProxyArtifact from '../../src/artifacts/contracts/contracts/09-WithdrawBypass/WithdrawByPollProxy.sol/WithdrawByPollProxy.json';

import RewardByArtifact from '../../src/artifacts/contracts/contracts/10-RewardBypass/RewardBy.sol/RewardBy.json';
import RewardByPollArtifact from '../../src/artifacts/contracts/contracts/10-RewardBypass/RewardByPoll.sol/RewardByPoll.json';
import RewardByPollProxyArtifact from '../../src/artifacts/contracts/contracts/10-RewardBypass/RewardByPollProxy.sol/RewardByPollProxy.json';

import { Contract } from 'web3-eth-contract';
import { getSelectors, deployContract, NetworkProvider, sendTransaction } from './network';

export async function updateAssetPool(facets: any, solution: Contract, npid: NetworkProvider) {
    for (const facet of facets) {
        const contract = await deployContract(facet.abi, facet.bytecode, [], npid);
        await sendTransaction(solution.methods.updateAssetPool(getSelectors(contract), contract.options.address), npid);
    }
}

export const downgradeFromBypassPolls = async (npid: NetworkProvider, solution: Contract) => {
    return await updateAssetPool(
        [
            WithdrawArtifact,
            WithdrawPollArtifact,
            WithdrawPollProxyArtifact,
            RewardArtifact,
            RewardPollArtifact,
            RewardPollProxyArtifact,
        ],
        solution,
        npid,
    );
};

export const updateToBypassPolls = async (npid: NetworkProvider, solution: Contract) => {
    return await updateAssetPool(
        [
            WithdrawByArtifact,
            WithdrawByPollArtifact,
            WithdrawByPollProxyArtifact,
            RewardByArtifact,
            RewardByPollArtifact,
            RewardByPollProxyArtifact,
        ],
        solution,
        npid,
    );
};
