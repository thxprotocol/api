import express from 'express';
import assertScopes from 'express-jwt-authz';
import { assertRequestInput, assertAssetPoolAccess, requireAssetPoolHeader } from '../../middlewares';
import CreatePaymentController, { createPaymentValidation } from './post.controller';

const router = express.Router();

router.post(
    '/',
    assertScopes(['user', 'payments:read', 'payments:write']),
    assertAssetPoolAccess,
    assertRequestInput(createPaymentValidation),
    requireAssetPoolHeader,
    CreatePaymentController,
);

export default router;
