import { ethers } from 'ethers';
import { body, param, query } from 'express-validator';
import { validateAssetPoolHeader } from '../../util/validation';

export const validations = {
    getWithdrawal: [
        validateAssetPoolHeader,
        param('address')
            .exists()
            .custom((value) => {
                return ethers.utils.isAddress(value);
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
        param('address')
            .exists()
            .custom((value) => {
                return ethers.utils.isAddress(value);
            }),
    ],
};
