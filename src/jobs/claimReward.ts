import { IAssetPool } from '../models/AssetPool';

import MembershipService from '@/services/MembershipService';
import AssetPoolService from '@/services/AssetPoolService';
import AccountProxy from '../proxies/AccountProxy';
import RewardService from '../services/RewardService';
import MemberService from '../services/MemberService';
import WithdrawalService from '../services/WithdrawalService';

const ERROR_CAN_NOT_CLAIM = 'Claim conditions are currently not valid.';

export async function jobClaimReward(assetPool: IAssetPool, id: string, rewardId: number, beneficiary: string) {
    const { account } = await AccountProxy.getByAddress(beneficiary);
    const { reward } = await RewardService.get(assetPool, rewardId);
    const { canClaim } = await RewardService.canClaim(assetPool, reward, account);
    const { isMember } = await MemberService.isMember(assetPool, beneficiary);
    const shouldAddMember = !reward.isMembershipRequired && !isMember;

    if (!canClaim) {
        throw new Error(ERROR_CAN_NOT_CLAIM);
    }

    if (shouldAddMember) {
        await MemberService.addMember(assetPool, beneficiary);
        await MembershipService.addMembership(account.id, assetPool);
    }

    await RewardService.claimRewardFor(assetPool, id, rewardId, beneficiary);

    const { canBypassPoll } = await AssetPoolService.canBypassWithdrawPoll(assetPool, account, reward);

    if (canBypassPoll) {
        await WithdrawalService.withdrawPollFinalize(assetPool, id);
    }
}
