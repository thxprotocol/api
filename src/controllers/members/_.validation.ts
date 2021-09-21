import { body, param } from 'express-validator';
import { isAddress } from 'web3-utils';

export const validations = {
    postMember: [
        body('address')
            .exists()
            .custom((value) => {
                return isAddress(value);
            }),
    ],
    patchMember: [
        param('address')
            .exists()
            .custom((value) => {
                return isAddress(value);
            }),
        ,
        body('isManager').exists(),
    ],
    deleteMember: [
        param('address')
            .exists()
            .custom((value) => {
                return isAddress(value);
            }),
    ],
    getMember: [
        param('address')
            .exists()
            .custom((value) => {
                return isAddress(value);
            }),
    ],
};
