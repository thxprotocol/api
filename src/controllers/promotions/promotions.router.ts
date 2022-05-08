import express from 'express';
import assertScopes from 'express-jwt-authz';
import { assertAssetPoolAccess, assertRequestInput, requireAssetPoolHeader } from '@/middlewares';
import CreatePromoCodeController, { createPromoCodeValidation } from './post.controller';
import ReadPromoCodeController, { readPromoCodeValidation } from './get.controller';
import ReadAllPromoCodeController, { readAllPromoCodeValidation } from './list.controller';
import DeletePromoCodeController from './delete.controller';

const router = express.Router();

router.post(
    '/',
    assertAssetPoolAccess,
    assertScopes(['dashboard', 'promo_codes:read', 'promo_codes:write']),
    assertRequestInput(createPromoCodeValidation),
    requireAssetPoolHeader,
    CreatePromoCodeController,
);
router.get(
    '/',
    assertAssetPoolAccess,
    assertScopes(['dashboard', 'user', 'promo_codes:read']),
    assertRequestInput(readAllPromoCodeValidation),
    requireAssetPoolHeader,
    ReadAllPromoCodeController,
);
router.get(
    '/:id',
    assertAssetPoolAccess,
    assertScopes(['dashboard', 'promo_codes:read']),
    assertRequestInput(readPromoCodeValidation),
    requireAssetPoolHeader,
    ReadPromoCodeController,
);
router.delete(
    '/:id',
    assertAssetPoolAccess,
    assertScopes(['dashboard', 'promo_codes:read', 'promo_codes:write']),
    assertRequestInput(readPromoCodeValidation),
    requireAssetPoolHeader,
    DeletePromoCodeController,
);

export default router;
