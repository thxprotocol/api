import { body, param } from 'express-validator';
import { ethers } from 'ethers';
import { validateAssetPoolHeader } from '../../util/validation';

export const validations = {
    getPoll: [
        validateAssetPoolHeader,
        param('address')
            .exists()
            .custom((value) => {
                return ethers.utils.isAddress(value);
            }),
    ],
    getVote: [validateAssetPoolHeader, param('agree').exists()],
    getRevokeVote: [validateAssetPoolHeader],
    postVote: [
        validateAssetPoolHeader,
        param('address').exists(),
        body('call').exists(),
        body('nonce').exists(),
        body('sig').exists(),
    ],
    deleteVote: [validateAssetPoolHeader],
    postPollFinalize: [
        validateAssetPoolHeader,
        param('address').exists(),
        body('call').exists(),
        body('nonce').exists(),
        body('sig').exists(),
    ],
};
