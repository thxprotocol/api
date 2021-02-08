import { ethers } from 'ethers';
import { body } from 'express-validator';
import { validateAssetPoolHeader } from '../../util/validation';

export const validations = {
    postCall: [validateAssetPoolHeader, body('call').exists(), body('nonce').exists(), body('sig').exists()],
    postCallUpgradeAddress: [
        validateAssetPoolHeader,
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
    postCallAssetPool: [validateAssetPoolHeader, body('call').exists(), body('nonce').exists(), body('sig').exists()],
    postCallBasePoll: [validateAssetPoolHeader, body('call').exists(), body('nonce').exists(), body('sig').exists()],
};
