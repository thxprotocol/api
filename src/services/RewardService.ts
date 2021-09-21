import { IAssetPool } from '../models/AssetPool';
import { sendTransaction } from '../util/network';
import { Artifacts } from '../util/artifacts';
import { parseLogs, findEvent } from '../util/events';
import { Reward, RewardDocument } from '../models/Reward';
import WithdrawalService from './WithdrawalService';

const ERROR_REWARD_GET_FAILED = 'Could not get the reward information from the database';

export default class RewardService {
    static async get(assetPool: IAssetPool, rewardId: number) {
        try {
            const reward = await Reward.findOne({ poolAddress: assetPool.address, id: rewardId });

            return { reward };
        } catch (error) {
            return { error: ERROR_REWARD_GET_FAILED };
        }
    }

    static async canClaim(reward: RewardDocument, address: string) {
        try {
            const hasClaimed = reward.beneficiaries.includes(address);
            return { canClaim: !hasClaimed };
        } catch (error) {
            return { error };
        }
    }

    static async claimRewardFor(assetPool: IAssetPool, rewardId: number, address: string) {
        try {
            const tx = await sendTransaction(
                assetPool.solution.options.address,
                assetPool.solution.methods.claimRewardFor(rewardId, address),
                assetPool.network,
            );

            const events = parseLogs(Artifacts.IDefaultDiamond.abi, tx.logs);
            const event = findEvent('WithdrawPollCreated', events);
            const withdrawal = await WithdrawalService.save(assetPool, event.args.id, event.args.member);

            return { withdrawal };
        } catch (error) {
            return { error };
        }
    }

    static async claimRewardForOnce(assetPool: IAssetPool, rewardId: number, address: string) {
        try {
            const { withdrawal, error } = await this.claimRewardFor(assetPool, rewardId, address);

            if (error) {
                throw new Error('fail');
            }

            const reward = await Reward.findOne({ poolAddress: assetPool.address, id: rewardId });

            if (reward.beneficiaries.length) {
                reward.beneficiaries.push(address);
            } else {
                reward.beneficiaries = [address];
            }

            await reward.save();
            await withdrawal.save();

            return { withdrawal };
        } catch (error) {
            return { error };
        }
    }
}
