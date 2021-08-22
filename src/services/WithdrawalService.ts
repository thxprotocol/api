import { IAssetPool } from '../models/AssetPool';
import { sendTransaction } from '../util/network';
import { Artifacts } from '../util/artifacts';
import { parseLogs, findEvent } from '../util/events';
import { Withdrawal, WithdrawalState } from '../models/Withdrawal';

export default class WithdrawalService {
    static async get(assetPool: IAssetPool, withdrawalId: number) {
        try {
            const withdrawal = await Withdrawal.findOne({ poolAddress: assetPool.address, id: withdrawalId });

            return { withdrawal };
        } catch (error) {
            return { error };
        }
    }

    static async withdrawPollFinalize(assetPool: IAssetPool, withdrawalId: number) {
        try {
            const withdrawal = await Withdrawal.findOne({ poolAddress: assetPool.address, id: withdrawalId });
            const tx = await sendTransaction(
                assetPool.solution.options.address,
                assetPool.solution.methods.withdrawPollFinalize(withdrawalId),
                assetPool.network,
            );

            const events = parseLogs(Artifacts.IDefaultDiamond.abi, tx.logs);
            const eventWithdrawPollFinalized = findEvent('WithdrawPollFinalized', events);
            const eventWithdrawn = findEvent('Withdrawn', events);

            if (eventWithdrawPollFinalized) {
                withdrawal.poll = null;
            }

            if (eventWithdrawn) {
                withdrawal.state = WithdrawalState.Withdrawn;
            }

            await withdrawal.save();

            return {
                result: true,
            };
        } catch (error) {
            return { error };
        }
    }
}
