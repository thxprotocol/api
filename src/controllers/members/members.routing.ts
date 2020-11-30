import express from 'express';
import { validations, validate, validateAssetPoolHeader } from '../../util/validation';
import { getMember } from './get.action';
import { postMember } from './post.action';
import { patchMember } from './patch.action';
import { deleteMember } from './delete.action';
import { body, param } from 'express-validator';
import { ethers } from 'ethers';

const router = express.Router();

router.post(
    '/',
    validate([
        validateAssetPoolHeader,
        body('address')
            .exists()
            .custom((value) => {
                return ethers.utils.isAddress(value);
            }),
    ]),
    postMember,
);
router.patch(
    '/:address',
    validate([
        validateAssetPoolHeader,
        param('address')
            .exists()
            .custom((value) => {
                return ethers.utils.isAddress(value);
            }),
        ,
        body('isManager').exists(),
    ]),
    patchMember,
);
router.delete(
    '/:address',
    validate([
        validateAssetPoolHeader,
        param('address')
            .exists()
            .custom((value) => {
                console.log('isaddr', ethers.utils.isAddress(value));
                return ethers.utils.isAddress(value);
            }),
    ]),
    deleteMember,
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
    getMember,
);

export default router;
