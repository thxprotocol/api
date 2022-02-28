import { EventLog } from 'web3-core';
import { WithdrawalState } from '@/enums/WithdrawalState';
import { Withdrawal } from '@/models/Withdrawal';
import { AssetPool, AssetPoolDocument } from '@/models/AssetPool';
import { getProvider, solutionContract } from '@/util/network';

export async function jobRequireWithdraws() {
    const assetPools = await AssetPool.find();

    assetPools.forEach(async (pool: AssetPoolDocument) => {
        // Get pending withdrawals for pool
        const pendingWithdrawals = await Withdrawal.find({ state: WithdrawalState.Pending, poolAddress: pool.address });

        // Skip getPastEvents if there are no pending withdrawals.
        if (pendingWithdrawals.length) {
            const { web3 } = getProvider(pool.network);
            const toBlock = await web3.eth.getBlockNumber();
            const solution = solutionContract(pool.network, pool.address);
            // Set it on the pool as per IAssetPool
            pool.solution = solution;

            const events = await solution.getPastEvents('Withdrawn', {
                fromBlock: pool.blockNumber,
                toBlock,
            });

            events.forEach(async (event: EventLog) => {
                const withdrawal = await Withdrawal.findOne({
                    state: WithdrawalState.Pending,
                    poolAddress: pool.address,
                    withdrawalId: event.returnValues.id,
                });

                withdrawal.state = WithdrawalState.Withdrawn;
                withdrawal.failReason = '';

                await withdrawal.save();
            });

            pool.blockNumber = toBlock;
            await pool.save();
        }
    });
}
