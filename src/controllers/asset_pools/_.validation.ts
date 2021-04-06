import { body, param } from 'express-validator';
import { ethers } from 'ethers';

export const validations = {
    postAssetPool: [
        body('token')
            .exists()
            .custom((value) => {
                if (value.address) {
                    return ethers.utils.isAddress(value.address);
                }

                if (
                    !value.address &&
                    value.name &&
                    value.symbol &&
                    (!Number.isNaN(value.totalSupply) || value.totalSupply === 0)
                ) {
                    return true;
                }

                return false;
            }),
        body('title').exists(),
        body('aud').exists(),
    ],
    deleteAssetPool: [
        param('address')
            .exists()
            .custom((value) => {
                return ethers.utils.isAddress(value);
            }),
    ],
    getAssetPool: [
        param('address')
            .exists()
            .custom((value) => {
                return ethers.utils.isAddress(value);
            }),
    ],
    patchAssetPool: [
        body('bypassPolls').optional().isBoolean(),
        body('rewardPollDuration').optional().isNumeric(),
        body('proposeWithdrawPollDuration').optional().isNumeric(),
    ],
};
