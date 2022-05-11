import express from 'express';
import assertScopes from 'express-jwt-authz';
import { assertRequestInput, assertAssetPoolAccess, requireAssetPoolHeader } from '@/middlewares';
import createPayment, { createPaymentValidation } from './post.controller';
import { getPayment, getPaymentValidation } from './get.action';

const router = express.Router();

router.post(
    '/',
    assertScopes(['admin']),
    assertAssetPoolAccess,
    assertRequestInput(createPaymentValidation),
    requireAssetPoolHeader,
    createPayment,
);

router.get('/:id', assertScopes(['admin']), assertRequestInput(getPaymentValidation), getPayment);

export default router;
