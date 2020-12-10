import { body } from 'express-validator';
import { validateAssetPoolHeader } from '../../util/validation';

export const validations = {
    postCallAssetPool: [validateAssetPoolHeader, body('call').exists(), body('nonce').exists(), body('sig').exists()],
    postCallBasePoll: [validateAssetPoolHeader, body('call').exists(), body('nonce').exists(), body('sig').exists()],
};
