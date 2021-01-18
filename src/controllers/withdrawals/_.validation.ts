import { ethers } from 'ethers';
import { param, query } from 'express-validator';
import { validateAssetPoolHeader } from '../../util/validation';

export const validations = {
    getWithdrawal: [
        validateAssetPoolHeader,
        param('id')
            .exists()
            .custom((value) => {
                // todo
                return true;
            }),
    ],
    getWithdrawals: [
        validateAssetPoolHeader,
        query('member')
            .exists()
            .custom((value) => {
                return ethers.utils.isAddress(value);
            }),
    ],
    postWithdrawalWithdraw: [
        validateAssetPoolHeader,
        param('id')
            .exists()
            .custom((value) => {
                // todo
                return true;
            }),
    ],
};
