import { IAssetPool } from '../models/AssetPool';

import RewardService from '../services/RewardService';

export async function jobClaimRewardFor(assetPool: IAssetPool, id: string, rewardId: number, beneficiary: string) {
    await RewardService.claimRewardFor(assetPool, id, rewardId, beneficiary);
}
