import { ethers } from 'ethers';
import { body, param } from 'express-validator';
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
        body('member')
            .exists()
            .custom((value) => {
                return ethers.utils.isAddress(value);
            }),
    ],
    postWithdrawal: [validateAssetPoolHeader, body('call').exists(), body('nonce').exists(), body('sig').exists()],
    getWithdrawalWithdraw: [
        validateAssetPoolHeader,
        param('address')
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
