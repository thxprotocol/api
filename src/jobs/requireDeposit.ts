import { toWei } from 'web3-utils';
import { DepositState } from '@/enums/DepositState';
import { Deposit, DepositDocument } from '@/models/Deposit';
import AssetPoolService from '@/services/AssetPoolService';
import { getProvider, tokenContract } from '@/util/network';
import { GetPastTransferEventsError } from '@/util/errors';
import { TransactionService } from '@/services/TransactionService';

export async function jobRequireDeposits() {
    const pendingDeposits = await Deposit.find({ state: DepositState.Pending });

    pendingDeposits.forEach(async (d: DepositDocument) => {
        // Assumed the receiver is an asset pool
        const assetPool = await AssetPoolService.getByAddress(d.receiver);
        // TODO This call should be cached in the assetpool document
        const tokenAddress = await TransactionService.call(assetPool.solution.methods.getToken(), assetPool.network);
        const token = tokenContract(assetPool.network, tokenAddress);
        const { web3 } = getProvider(assetPool.network);
        // Use toBlock limit current query and provide start index for next
        const toBlock = await web3.eth.getBlockNumber();

        token.getPastEvents(
            'Transfer',
            {
                filter: { from: d.sender, to: d.receiver, amount: toWei(String(d.amount)) },
                fromBlock: assetPool.blockNumber,
                toBlock,
            },
            (error: Error, event: any) => {
                if (error) {
                    throw new GetPastTransferEventsError();
                }

                if (event) {
                    d.state = DepositState.Completed;
                }

                d.fromBlock = toBlock;
                d.save();
            },
        );
    });
}
