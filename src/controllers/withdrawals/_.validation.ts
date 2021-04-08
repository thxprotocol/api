import { ethers } from 'ethers';
import { header, param, query } from 'express-validator';

export const validations = {
    getWithdrawals: [header('AssetPool').exists()],
    getWithdrawalsForMember: [
        query('member')
            .exists()
            .custom((value) => {
                return ethers.utils.isAddress(value);
            }),
    ],
    getWithdrawal: [param('id').exists().isNumeric()],
    postWithdrawalWithdraw: [param('id').exists().isNumeric()],
    postVote: [param('id').exists().isNumeric(), header('AssetPool').exists()],
    deleteVote: [param('id').exists().isNumeric(), header('AssetPool').exists()],
    postPollFinalize: [param('id').exists().isNumeric()],
};
