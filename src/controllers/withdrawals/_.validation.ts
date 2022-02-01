import { body, header, param, query } from 'express-validator';
import { isAddress } from 'web3-utils';

export const validations = {
    getWithdrawals: [
        header('AssetPool').exists(),
        query('page').exists().isNumeric(),
        query('limit').exists().isNumeric(),
        query('member')
            .optional()
            .isString()
            .custom((value) => {
                return isAddress(value);
            }),
        query('rewardId').optional().isNumeric(),
        query('state').optional().isNumeric(),
    ],
    getWithdrawal: [param('id').exists().isString()],
    postWithdrawal: [
        body('member')
            .exists()
            .custom((value) => {
                return isAddress(value);
            }),
        ,
        body('amount').exists().isNumeric(),
    ],
    postWithdrawalWithdraw: [param('id').exists().isString()],
    postVote: [param('id').exists().isString(), header('AssetPool').exists()],
    deleteVote: [param('id').exists().isString(), header('AssetPool').exists()],
    postPollFinalize: [param('id').exists().isString()],
};
