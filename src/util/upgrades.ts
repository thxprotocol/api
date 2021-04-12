import { Contract, ethers } from 'ethers/lib';

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
import { getSelectors } from './factory';
import { getAdmin, NetworkProvider } from './network';

export const downgradeFromBypassPolls = async (npid: NetworkProvider, solution: Contract) => {
    const withdrawFacetFactory = new ethers.ContractFactory(
        WithdrawArtifact.abi,
        WithdrawArtifact.bytecode,
        getAdmin(npid),
    );
    const withdrawPollFacetFactory = new ethers.ContractFactory(
        WithdrawPollArtifact.abi,
        WithdrawPollArtifact.bytecode,
        getAdmin(npid),
    );
    const withdrawPollProxyFacetFactory = new ethers.ContractFactory(
        WithdrawPollProxyArtifact.abi,
        WithdrawPollProxyArtifact.bytecode,
        getAdmin(npid),
    );

    const rewardFacetFactory = new ethers.ContractFactory(RewardArtifact.abi, RewardArtifact.bytecode, getAdmin(npid));
    const rewardPollFacetFactory = new ethers.ContractFactory(
        RewardPollArtifact.abi,
        RewardPollArtifact.bytecode,
        getAdmin(npid),
    );
    const rewardPollProxyFacetFactory = new ethers.ContractFactory(
        RewardPollProxyArtifact.abi,
        RewardPollProxyArtifact.bytecode,
        getAdmin(npid),
    );

    const withdrawFacet = await withdrawFacetFactory.deploy();
    await withdrawFacet.deployTransaction.wait();
    const withdrawPollFacet = await withdrawPollFacetFactory.deploy();
    await withdrawPollFacet.deployTransaction.wait();
    const withdrawPollProxyFacet = await withdrawPollProxyFacetFactory.deploy();
    await withdrawPollProxyFacet.deployTransaction.wait();

    const rewardFacet = await rewardFacetFactory.deploy();
    await rewardFacet.deployTransaction.wait();
    const rewardPollFacet = await rewardPollFacetFactory.deploy();
    await rewardPollFacet.deployTransaction.wait();
    const rewardPollProxyFacet = await rewardPollProxyFacetFactory.deploy();
    await rewardPollProxyFacet.deployTransaction.wait();

    await solution.updateAssetPool(getSelectors(withdrawFacet), withdrawFacet.address);
    await solution.updateAssetPool(getSelectors(withdrawPollFacet), withdrawPollFacet.address);
    await solution.updateAssetPool(getSelectors(withdrawPollProxyFacet), withdrawPollProxyFacet.address);

    await solution.updateAssetPool(getSelectors(rewardFacet), rewardFacet.address);
    await solution.updateAssetPool(getSelectors(rewardPollFacet), rewardPollFacet.address);
    await solution.updateAssetPool(getSelectors(rewardPollProxyFacet), rewardPollProxyFacet.address);
};

export const updateToBypassPolls = async (npid: NetworkProvider, solution: Contract) => {
    const withdrawByFacetFactory = new ethers.ContractFactory(
        WithdrawByArtifact.abi,
        WithdrawByArtifact.bytecode,
        getAdmin(npid),
    );
    const withdrawByPollFacetFactory = new ethers.ContractFactory(
        WithdrawByPollArtifact.abi,
        WithdrawByPollArtifact.bytecode,
        getAdmin(npid),
    );
    const withdrawByPollProxyFacetFactory = new ethers.ContractFactory(
        WithdrawByPollProxyArtifact.abi,
        WithdrawByPollProxyArtifact.bytecode,
        getAdmin(npid),
    );

    const rewardByFacetFactory = new ethers.ContractFactory(
        RewardByArtifact.abi,
        RewardByArtifact.bytecode,
        getAdmin(npid),
    );
    const rewardByPollFacetFactory = new ethers.ContractFactory(
        RewardByPollArtifact.abi,
        RewardByPollArtifact.bytecode,
        getAdmin(npid),
    );
    const rewardByPollProxyFacetFactory = new ethers.ContractFactory(
        RewardByPollProxyArtifact.abi,
        RewardByPollProxyArtifact.bytecode,
        getAdmin(npid),
    );

    const withdrawByFacet = await withdrawByFacetFactory.deploy();
    await withdrawByFacet.deployTransaction.wait();
    const withdrawByPollFacet = await withdrawByPollFacetFactory.deploy();
    await withdrawByPollFacet.deployTransaction.wait();
    const withdrawByPollProxyFacet = await withdrawByPollProxyFacetFactory.deploy();
    await withdrawByPollProxyFacet.deployTransaction.wait();

    const rewardByFacet = await rewardByFacetFactory.deploy();
    await rewardByFacet.deployTransaction.wait();
    const rewardByPollFacet = await rewardByPollFacetFactory.deploy();
    await rewardByPollFacet.deployTransaction.wait();
    const rewardByPollProxyFacet = await rewardByPollProxyFacetFactory.deploy();
    await rewardByPollProxyFacet.deployTransaction.wait();

    await solution.updateAssetPool(getSelectors(withdrawByFacet), withdrawByFacet.address);
    await solution.updateAssetPool(getSelectors(withdrawByPollFacet), withdrawByPollFacet.address);
    await solution.updateAssetPool(getSelectors(withdrawByPollProxyFacet), withdrawByPollProxyFacet.address);

    await solution.updateAssetPool(getSelectors(rewardByFacet), rewardByFacet.address);
    await solution.updateAssetPool(getSelectors(rewardByPollFacet), rewardByPollFacet.address);
    await solution.updateAssetPool(getSelectors(rewardByPollProxyFacet), rewardByPollProxyFacet.address);
};
