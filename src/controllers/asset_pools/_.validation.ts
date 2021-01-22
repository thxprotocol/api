import { body, param } from 'express-validator';
import { ethers } from 'ethers';
import { validateAssetPoolHeader } from '../../util/validation';

export const validations = {
    postAssetPool: [
        body('token')
            .exists()
            .custom((value) => {
                return ethers.utils.isAddress(value);
            }),
        body('title').exists(),
    ],
    getAssetPool: [
        validateAssetPoolHeader,
        param('address')
            .exists()
            .custom((value) => {
                return ethers.utils.isAddress(value);
            }),
    ],
    patchAssetPool: [
        validateAssetPoolHeader,
        body('rewardPollDuration').optional().isNumeric(),
        body('proposeWithdrawPollDuration').optional().isNumeric(),
    ],
};
