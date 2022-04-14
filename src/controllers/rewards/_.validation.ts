import { body, header, param } from 'express-validator';

export const validations = {
    postReward: [
        body('withdrawLimit').exists().isNumeric(),
        body('withdrawAmount').exists().isNumeric(),
        body('withdrawDuration').exists().isNumeric(),
        body('withdrawLimit').optional().isNumeric(),
        body('withdrawCondition.channelType').optional().isNumeric(),
        body('withdrawCondition.channelAction').optional().isNumeric(),
        body('withdrawCondition.channelItem').optional().isString(),
    ],
    getRewards: [header('AssetPool').exists()],
    getReward: [param('id').exists().isNumeric()],
    patchReward: [
        param('id').exists().isNumeric(),
        body('withdrawAmount').optional().isNumeric(),
        body('withdrawDuration').optional().isNumeric(),
    ],
    postRewardClaim: [param('id').exists().isNumeric()],
    postRewardClaimFor: [param('id').exists(), body('member').exists()],
    postVote: [param('id').exists().isNumeric(), body('agree').exists()],
    deleteVote: [param('id').exists().isNumeric(), param('address').exists()],
    postPollFinalize: [param('id').exists().isNumeric()],
};
