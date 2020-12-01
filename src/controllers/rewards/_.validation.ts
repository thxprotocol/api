import { body, param } from 'express-validator';
import { validateAssetPoolHeader } from '../../util/validation';

export const validations = {
    postReward: [
        validateAssetPoolHeader,
        body('title').exists(),
        body('description').exists(),
        body('withdrawAmount').exists(),
        body('withdrawDuration').exists(),
    ],
    getReward: [validateAssetPoolHeader, param('id').exists().isNumeric()],
    patchReward: [validateAssetPoolHeader],
    putReward: [
        validateAssetPoolHeader,
        body('withdrawAmount').exists(),
        body('withdrawDuration').exists(),
        body('title').exists(),
        body('description').exists(),
    ],
    getRewardClaim: [validateAssetPoolHeader, param('id').exists()],
    postRewardClaim: [
        validateAssetPoolHeader,
        param('id').exists(),
        body('call').exists(),
        body('nonce').exists(),
        body('sig').exists(),
    ],
};
