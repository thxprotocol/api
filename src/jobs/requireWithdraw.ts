import { toWei } from 'web3-utils';
import { WithdrawalState } from '@/enums/WithdrawalState';
import { Withdrawal, WithdrawalDocument } from '@/models/Withdrawal';
import AssetPoolService from '@/services/AssetPoolService';
import { getProvider } from '@/util/network';
import { GetPastWithdrawnEventsError } from '@/util/errors';

export async function jobRequireWithdraws() {
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
                console.dir({ error, event }, { colors: true });
                if (error) {
                    throw new GetPastWithdrawnEventsError();
                }

                if (event) {
                    w.state = WithdrawalState.Withdrawn;
                }

                w.fromBlock = toBlock;
                w.save();
            },
        );
    });
}
