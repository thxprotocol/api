import { WithdrawalState } from '@/enums/WithdrawalState';
import { Withdrawal } from '@/models/Withdrawal';
import { AssetPool, AssetPoolDocument } from '@/models/AssetPool';
import { getProvider, solutionContract } from '@/util/network';

const BLOCK_PERIOD_LIMIT = 3499; // Limit is 3500

export async function jobRequireWithdraws() {
    const assetPools = await AssetPool.find();

    assetPools.forEach(async (pool: AssetPoolDocument) => {
        // Get pending withdrawals for pool
        const pendingWithdrawals = await Withdrawal.find({ state: WithdrawalState.Pending, poolAddress: pool.address });

        // Skip getPastEvents if there are no pending withdrawals.
        if (pendingWithdrawals.length) {
            const { web3 } = getProvider(pool.network);
            const solution = solutionContract(pool.network, pool.address);
            // Set it on the pool as per IAssetPool
            pool.solution = solution;

            const latestBlock = await web3.eth.getBlockNumber();
            let toBlock = pool.blockNumber;

            // Scan batches of 3500 blocks and repeat until latestBlock is reached
            while (toBlock < latestBlock) {
                const events = await solution.getPastEvents('Withdrawn', {
                    fromBlock: pool.blockNumber,
                    toBlock,
                });

                for (const event of events) {
                    await Withdrawal.updateOne(
                        {
                            state: WithdrawalState.Pending,
                            poolAddress: pool.address,
                            withdrawalId: event.returnValues.id,
                        },
                        {
                            state: WithdrawalState.Withdrawn,
                            failReason: '',
                        },
                    );
                }

                pool.blockNumber = toBlock;
                await pool.save();

                // Use latestBlock if period exceeds latestBlock or use current toBlock + period if it doesnt
                toBlock = toBlock + BLOCK_PERIOD_LIMIT > latestBlock ? latestBlock : toBlock + BLOCK_PERIOD_LIMIT;
            }
        }
    });
}
