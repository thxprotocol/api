import { ethers } from 'ethers';
import { body } from 'express-validator';

export const validations = {
    postCall: [body('call').exists(), body('nonce').exists(), body('sig').exists()],
    postCallUpgradeAddress: [
        body('oldAddress')
            .exists()
            .custom((value) => {
                return ethers.utils.isAddress(value);
            }),
        ,
        body('newAddress')
            .exists()
            .custom((value) => {
                return ethers.utils.isAddress(value);
            }),
        ,
        body('call').exists(),
        body('nonce').exists(),
        body('sig').exists(),
    ],
};
