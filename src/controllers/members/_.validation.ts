import { ethers } from 'ethers';
import { body, param } from 'express-validator';
import { validateAssetPoolHeader } from '../../util/validation';

export const validations = {
    postMember: [
        validateAssetPoolHeader,
        body('address')
            .exists()
            .custom((value) => {
                return ethers.utils.isAddress(value);
            }),
    ],
    patchMember: [
        validateAssetPoolHeader,
        param('address')
            .exists()
            .custom((value) => {
                return ethers.utils.isAddress(value);
            }),
        ,
        body('isManager').exists(),
    ],
    deleteMember: [
        validateAssetPoolHeader,
        param('address')
            .exists()
            .custom((value) => {
                return ethers.utils.isAddress(value);
            }),
    ],
    getMember: [
        validateAssetPoolHeader,
        param('address')
            .exists()
            .custom((value) => {
                return ethers.utils.isAddress(value);
            }),
    ],
};
