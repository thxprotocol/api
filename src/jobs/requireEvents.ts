import { toWei, fromWei } from 'web3-utils';
import { WithdrawalState } from '@/enums/WithdrawalState';
import { Withdrawal, WithdrawalDocument } from '@/models/Withdrawal';
import AssetPoolService from '@/services/AssetPoolService';
import { getProvider, solutionContract } from '@/util/network';
import { GetPastWithdrawnEventsError } from '@/util/errors';
import { AssetPool, AssetPoolDocument } from '@/models/AssetPool';
import { EventLog } from 'web3-core';

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
                // const withdrawalId = event.returnValues.id
                // const beneficiary = event.returnValues.beneficiary
                // Call getAmount(id)
                // Check w.amount and w.beneficiary === beneficiary
                console.log(event);
                // Remove failreason
                // Schedule a finalize withdrawal
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
        const { assetPool } = await AssetPoolService.getByAddress(w.poolAddress);
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
