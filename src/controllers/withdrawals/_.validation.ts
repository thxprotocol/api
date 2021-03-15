import { ethers } from 'ethers';
import { body, param, query } from 'express-validator';
import { validateAssetPoolHeader } from '../../util/validation';

export const validations = {
    getWithdrawals: [validateAssetPoolHeader],
    getWithdrawalsForMember: [
        validateAssetPoolHeader,
        query('member')
            .exists()
            .custom((value) => {
                return ethers.utils.isAddress(value);
            }),
    ],
    getWithdrawal: [validateAssetPoolHeader, param('id').exists().isNumeric()],
    postWithdrawalWithdraw: [validateAssetPoolHeader, param('id').exists().isNumeric()],
    postVote: [validateAssetPoolHeader, param('id').exists().isNumeric(), body('agree').exists()],
    deleteVote: [validateAssetPoolHeader, param('id').exists().isNumeric(), param('address').exists()],
    postPollFinalize: [validateAssetPoolHeader, param('id').exists().isNumeric()],
};
