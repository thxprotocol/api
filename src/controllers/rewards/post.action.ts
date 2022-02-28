import { Request, Response } from 'express';
import { VERSION } from '@/util/secrets';
import { toWei } from 'web3-utils';
import BN from 'bn.js';

import RewardService from '@/services/RewardService';
import AssetPoolService from '@/services/AssetPoolService';

export const postReward = async (req: Request, res: Response) => {
    const withdrawAmount = toWei(String(req.body.withdrawAmount));
    const withdrawDuration = req.body.withdrawDuration;
    const withdrawCondition = req.body.withdrawCondition;
    const isMembershipRequired = req.body.isMembershipRequired;
    const isClaimOnce = req.body.isClaimOnce;

    const reward = await RewardService.create(
        req.assetPool,
        new BN(withdrawAmount),
        withdrawDuration,
        isMembershipRequired,
        isClaimOnce,
        withdrawCondition,
    );

    if (await AssetPoolService.canBypassRewardPoll(req.assetPool)) {
        await RewardService.finalizePoll(req.assetPool, reward);
    }

    res.redirect(`/${VERSION}/rewards/${reward.id}`);
};
