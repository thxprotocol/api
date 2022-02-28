import RewardService from '@/services/RewardService';
import AssetPoolService from '@/services/AssetPoolService';
import { Request, Response } from 'express';
import { RewardState, TReward } from '@/models/Reward';

export async function patchReward(req: Request, res: Response) {
    const reward = await RewardService.get(req.assetPool, Number(req.params.id));
    let withdrawAmount = reward.withdrawAmount;
    let withdrawDuration = reward.withdrawDuration;

    const shouldUpdateWithdrawAmount = req.body.withdrawAmount && reward.withdrawAmount !== req.body.withdrawAmount;
    const shouldUpdateWithdrawDuration =
        req.body.withdrawDuration && reward.withdrawDuration !== req.body.withdrawDuration;
    const shouldUpdateState = typeof req.body.state !== undefined && reward.state !== req.body.state;

    if (shouldUpdateWithdrawAmount || shouldUpdateWithdrawDuration) {
        if (shouldUpdateWithdrawAmount) withdrawAmount = req.body.withdrawAmount;
        if (shouldUpdateWithdrawDuration) withdrawDuration = Number(req.body.withdrawDuration);

        const updatedReward = await RewardService.update(req.assetPool, reward, {
            withdrawAmount,
            withdrawDuration,
        });

        if (updatedReward.pollId > 0 && (await AssetPoolService.canBypassRewardPoll(req.assetPool))) {
            const finalizedReward: TReward = await RewardService.finalizePoll(req.assetPool, updatedReward);

            return res.json(finalizedReward);
        } else {
            return res.json(updatedReward);
        }
    }

    if (shouldUpdateState) {
        switch (req.body.state) {
            case RewardState.Enabled:
                return res.json(await (await RewardService.enable(req.assetPool, reward)).save());
            case RewardState.Disabled:
                return res.json(await (await RewardService.disable(req.assetPool, reward)).save());
        }
    }

    res.json(reward);
}
