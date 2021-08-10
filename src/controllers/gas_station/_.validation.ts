import { isAddress } from 'web3-utils';
import { body } from 'express-validator';

export const validations = {
    postCall: [body('call').exists(), body('nonce').exists(), body('sig').exists()],
    postCallUpgradeAddress: [
        body('newAddress')
            .exists()
            .custom((value: string) => isAddress(value)),
        body('call').exists(),
        body('nonce').exists(),
        body('sig').exists(),
    ],
};
