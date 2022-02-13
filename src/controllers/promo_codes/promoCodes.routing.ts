import express from 'express';
import assertScopes from 'express-jwt-authz';
import { assertRequestInput, assertAssetPoolAccess, requireAssetPoolHeader } from '../../middlewares';
import CreatePromoCodeController, { createPromoCodeValidation } from './post.controller';
import ReadPromoCodeController, { readPromoCodeValidation } from './get.controller';
import ReadAllPromoCodeController, { readAllPromoCodeValidation } from './getAll.controller';
import RedeemPromoCodeController, { redeemPromoCodeValidation } from './redeem/post.controller';

const router = express.Router();

router.post(
    '/',
    assertScopes(['dashboard', 'promo_codes:write', 'promo_codes:read']),
    assertRequestInput(createPromoCodeValidation),
    CreatePromoCodeController,
);
router.get(
    '/',
    assertScopes(['dashboard', 'user', 'promo_codes:read']),
    assertRequestInput(readAllPromoCodeValidation),
    ReadAllPromoCodeController,
);
router.get(
    '/:id',
    assertScopes(['dashboard', 'promo_codes:read']),
    assertRequestInput(readPromoCodeValidation),
    ReadPromoCodeController,
);
router.post(
    '/:id/redeem',
    assertScopes(['user', 'promo_codes:read']),
    assertAssetPoolAccess,
    assertRequestInput(redeemPromoCodeValidation),
    requireAssetPoolHeader,
    RedeemPromoCodeController,
);

export default router;
