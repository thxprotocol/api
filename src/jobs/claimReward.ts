import { Job } from 'agenda';
import { agenda } from '../util/agenda';
import { logger } from '../util/logger';
import { parseJobData } from '../util/agenda';
import { checkGasPrice } from '../util/gas';

import AssetPoolService from '../services/AssetPoolService';
import RewardService from '../services/RewardService';
import MemberService from '../services/MemberService';
import MembershipService from '../services/MembershipService';
import AccountService from '../proxies/AccountProxy';
import WithdrawalService from '../services/WithdrawalService';

const ERROR_CAN_NOT_CLAIM = 'Claim conditions are currently not valid.';

agenda.define('claimReward', async (job: Job) => {
    const { assetPool, data } = await parseJobData(job);

    if (await checkGasPrice(assetPool.network)) {
        job.schedule('in 5 seconds');
        await job.save();
    } else {
        const args = JSON.parse(data.args);
        const { account } = await AccountService.getByAddress(args[1]);
        const { reward } = await RewardService.get(assetPool, args[0]);
        const { canClaim } = await RewardService.canClaim(assetPool, reward, account);

        if (!canClaim) {
            throw new Error(ERROR_CAN_NOT_CLAIM);
        }

        if (data.shouldAddMember) {
            await MemberService.addMember(assetPool, args[1]);
            await MembershipService.addMembership(account._id.toString(), assetPool);
        }

        await RewardService.claimRewardFor(assetPool, data.id, args[0], args[1]);

        const { canBypassPoll } = await AssetPoolService.canBypassWithdrawPoll(assetPool, account, reward);

        if (canBypassPoll) {
            await WithdrawalService.withdrawPollFinalize(assetPool, data.id);
        }
    }
});

agenda.on('success:claimReward', async (job: Job) => {
    try {
        const { data, id } = await parseJobData(job);
        const { withdrawal } = await WithdrawalService.getById(data.id);

        await job.remove();

        withdrawal.jobId = null;
        await withdrawal.save();

        logger.info({ jobId: id, withdrawal: withdrawal._id.toString() });
    } catch (error) {
        logger.error({ error: error.toString() });
    }
});

agenda.on('fail:claimReward', async (error, job: Job) => {
    try {
        const { data, id } = await parseJobData(job);
        const { withdrawal } = await WithdrawalService.getById(data.id);

        await job.remove();
        await withdrawal.remove();

        logger.error({ jobId: id, error: error.toString() });
    } catch (error) {
        logger.error({ error: error.toString() });
    }
});
