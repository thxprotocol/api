import { body, header, param, query } from 'express-validator';
import { isAddress } from 'web3-utils';

export const validations = {
    getWithdrawals: [
        header('AssetPool').exists(),
        query('page').optional().exists(),
        query('limit').optional().exists(),
        query('member')
            .optional()
            .isString()
            .custom((value) => {
                return isAddress(value);
            }),
        query('rewardId').optional().isNumeric(),
        query('state').optional().isNumeric(),
    ],
    getWithdrawal: [param('id').exists().isNumeric()],
    postWithdrawal: [
        body('member')
            .exists()
            .custom((value) => {
                return isAddress(value);
            }),
        ,
        body('amount').exists().isNumeric(),
    ],
    postWithdrawalWithdraw: [param('id').exists().isNumeric()],
    postVote: [param('id').exists().isNumeric(), header('AssetPool').exists()],
    deleteVote: [param('id').exists().isNumeric(), header('AssetPool').exists()],
    postPollFinalize: [param('id').exists().isNumeric()],
};
