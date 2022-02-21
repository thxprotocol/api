import express from 'express';
import assertScopes from 'express-jwt-authz';
import { assertAssetPoolAccess, assertRequestInput, requireAssetPoolHeader } from '@/middlewares';
import { getAssetPools } from './getAll.action';
import { getAssetPool, readAssetPoolValidation } from './get.action';
import { createAssetPoolValidation, postAssetPool } from './post.controller';
import { patchAssetPool, updateAssetPoolValidation } from './patch.action';
import { deleteAssetPool, deleteAssetPoolValidation } from './delete.action';

const router = express.Router();

router.post('/', assertScopes(['dashboard']), assertRequestInput(createAssetPoolValidation), postAssetPool);
router.get('/', assertScopes(['dashboard']), getAssetPools);
router.get(
    '/:address',
    assertScopes(['admin', 'dashboard']),
    assertAssetPoolAccess,
    assertRequestInput(readAssetPoolValidation),
    requireAssetPoolHeader,
    getAssetPool,
);
router.patch(
    '/:address',
    assertScopes(['dashboard']),
    assertAssetPoolAccess,
    assertRequestInput(updateAssetPoolValidation),
    requireAssetPoolHeader,
    patchAssetPool,
);
router.delete(
    '/:address',
    assertScopes(['dashboard']),
    assertAssetPoolAccess,
    assertRequestInput(deleteAssetPoolValidation),
    requireAssetPoolHeader,
    deleteAssetPool,
);
export default router;
