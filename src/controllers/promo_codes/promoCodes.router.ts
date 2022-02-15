import express from 'express';
import assertScopes from 'express-jwt-authz';
import { assertRequestInput } from '@/middlewares';
import CreatePromoCodeController, { createPromoCodeValidation } from './post.controller';
import ReadPromoCodeController, { readPromoCodeValidation } from './get.controller';
import ReadAllPromoCodeController, { readAllPromoCodeValidation } from './getAll.controller';

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

export default router;
