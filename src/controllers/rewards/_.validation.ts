import { body, param } from 'express-validator';
import { validateAssetPoolHeader } from '../../util/validation';

export const validations = {
    postReward: [
        validateAssetPoolHeader,
        body('withdrawAmount').exists().isNumeric(),
        body('withdrawDuration').exists().isNumeric(),
    ],
    getRewards: [validateAssetPoolHeader],
    getReward: [validateAssetPoolHeader, param('id').exists().isNumeric()],
    patchReward: [validateAssetPoolHeader, param('id').exists().isNumeric()],
    postRewardClaim: [validateAssetPoolHeader, param('id').exists().isNumeric()],
    postRewardClaimFor: [validateAssetPoolHeader, param('id').exists(), body('member').exists()],
};
