import { body, param } from 'express-validator';
import { isAddress } from 'web3-utils';

export const validations = {
    postAssetPool: [
        body('token')
            .exists()
            .custom((value) => {
                if (value.address) {
                    return isAddress(value.address);
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
        body('network').exists().isNumeric(),
    ],
    postAssetPoolDepositApprove: [body('amount').exists().isNumeric()],
    deleteAssetPool: [
        param('address')
            .exists()
            .custom((value) => {
                return isAddress(value);
            }),
    ],
    getAssetPool: [
        param('address')
            .exists()
            .custom((value) => {
                return isAddress(value);
            }),
    ],
    patchAssetPool: [
        body('bypassPolls').optional().isBoolean(),
        body('rewardPollDuration').optional().isNumeric(),
        body('proposeWithdrawPollDuration').optional().isNumeric(),
    ],
};
