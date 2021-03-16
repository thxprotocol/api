import { body, param } from 'express-validator';
import { ethers } from 'ethers';
import { validateAssetPoolHeader } from '../../util/validation';

export const validations = {
    postAssetPool: [
        body('token')
            .exists()
            .custom((value) => {
                if (value.address) {
                    return ethers.utils.isAddress(value.address);
                }

                if (!value.address && value.name && value.symbol) {
                    return true;
                }

                return false;
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
        body('bypassPolls').optional().isBoolean(),
        body('rewardPollDuration').optional().isNumeric(),
        body('proposeWithdrawPollDuration').optional().isNumeric(),
    ],
};
