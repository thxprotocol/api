import express from 'express';
import { validate } from '../../util/validation';
import { validateAssetPoolHeader } from '../../util/validation';
import { body, param } from 'express-validator';
import { ethers } from 'ethers';

import { getAssetPool } from './get.action';
import { postAssetPool } from './post.action';
import { patchAssetPool } from './patch.action';

const router = express.Router();

router.post(
    '/',
    validate([
        body('token')
            .exists()
            .custom((value) => {
                return ethers.utils.isAddress(value);
            }),
        body('title').exists(),
    ]),
    postAssetPool,
);
router.get(
    '/:address',
    validate([
        validateAssetPoolHeader,
        param('address')
            .exists()
            .custom((value) => {
                return ethers.utils.isAddress(value);
            }),
    ]),
    getAssetPool,
);
router.patch(
    '/:address',
    validate([
        [
            validateAssetPoolHeader,
            body('rewardPollDuration').optional().isNumeric(),
            body('proposeWithdrawPollDuration').optional().isNumeric(),
        ],
    ]),
    patchAssetPool,
);

export default router;
