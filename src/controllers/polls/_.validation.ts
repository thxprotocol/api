import { body, param } from 'express-validator';
import { validateAssetPoolHeader } from '../../util/validation';

export const validations = {
    getPoll: [validateAssetPoolHeader, param('id').exists().isNumeric()],
    postVote: [validateAssetPoolHeader, param('id').exists().isNumeric(), body('agree').exists()],
    deleteVote: [validateAssetPoolHeader, param('id').exists().isNumeric(), param('address').exists()],
    postPollFinalize: [validateAssetPoolHeader, param('id').exists().isNumeric()],
};
