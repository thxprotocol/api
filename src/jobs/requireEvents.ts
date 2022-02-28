import { toWei } from 'web3-utils';
import { WithdrawalState } from '@/enums/WithdrawalState';
import { Withdrawal, WithdrawalDocument } from '@/models/Withdrawal';
import AssetPoolService from '@/services/AssetPoolService';
import { getProvider, solutionContract } from '@/util/network';
import { GetPastWithdrawnEventsError, GetPastWithdrawPollCreatedEventsError } from '@/util/errors';
import { AssetPool, AssetPoolDocument } from '@/models/AssetPool';
import { EventLog } from 'web3-core';
import WithdrawalService from '@/services/WithdrawalService';
import { TransactionService } from '@/services/TransactionService';

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

            // Called when a Withdrawn event is found
            const onWithdrawnEvent = async (error: Error, event: EventLog) => {
                if (error) {
                    throw new GetPastWithdrawnEventsError();
                }

                const withdrawal = await Withdrawal.findOne({
                    state: WithdrawalState.Pending,
                    poolAddress: pool.address,
                    withdrawalId: event.returnValues.id,
                });

                withdrawal.state = WithdrawalState.Withdrawn;
                withdrawal.failReason = '';

                await withdrawal.save();

                pool.blockNumber = toBlock;
                await pool.save();
            };

            // Called when a WithdrawPollCreated event is found
            const onWithdrawPollCreatedEvent = async (error: Error, event: EventLog) => {
                if (error) {
                    throw new GetPastWithdrawPollCreatedEventsError();
                }

                const withdrawal = await Withdrawal.findOne({
                    state: WithdrawalState.Pending,
                    poolAddress: pool.address,
                    beneficiary: event.returnValues.beneficiary,
                    withdrawalId: event.returnValues.id,
                });
                const amount = await TransactionService.call(
                    solution.methods.getAmount(event.returnValues.id),
                    pool.network,
                );

                if (amount !== withdrawal.amount) {
                    return;
                }

                if (pool.bypassPolls) {
                    await WithdrawalService.withdrawPollFinalize(pool, event.returnValues.id);
                }
            };

            solution.getPastEvents(
                'Withdrawn',
                {
                    fromBlock: pool.blockNumber,
                    toBlock,
                },
                onWithdrawnEvent,
            );
            solution.getPastEvents(
                'WithdrawPollCreated',
                {
                    fromBlock: pool.blockNumber,
                    toBlock,
                },
                onWithdrawPollCreatedEvent,
            );
        }
    });

    const pendingDeposits = await Withdrawal.find({ state: WithdrawalState.Pending });

    pendingDeposits.forEach(async (w: WithdrawalDocument) => {
        const assetPool = await AssetPoolService.getByAddress(w.poolAddress);
        const { web3 } = getProvider(assetPool.network);
        const toBlock = await web3.eth.getBlockNumber();

        assetPool.solution.getPastEvents(
            'Withdrawn',
            {
                filter: { from: w.poolAddress, to: w.beneficiary, amount: toWei(String(w.amount)) },
                fromBlock: assetPool.blockNumber,
                toBlock,
            },
            (error: Error, event: any) => {
                if (error) {
                    throw new GetPastWithdrawnEventsError();
                }

                if (event) {
                    w.state = WithdrawalState.Withdrawn;
                    w.failReason = '';
                }

                w.fromBlock = toBlock;
                w.save();
            },
        );
    });
}
