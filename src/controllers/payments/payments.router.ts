import express from 'express';
import assertScopes from 'express-jwt-authz';
import { assertRequestInput, assertAssetPoolAccess, requireAssetPoolHeader, checkJwt } from '@/middlewares';
import PostPayment from './post.controller';
import PostPaymentPay from './pay/post.controller';
import ReadPayment from './get.controller';
import ListPayment from './list.controller';

const router = express.Router();

// These 2 routes are public and authentication is handled with payment.token
router.get('/:id', assertRequestInput(ReadPayment.validation), ReadPayment.controller);
router.post(
    '/:id/pay',
    assertRequestInput(PostPaymentPay.validation),
    requireAssetPoolHeader,
    PostPaymentPay.controller,
);

router.use(checkJwt);
router.post(
    '/',
    assertScopes(['payments:write']),
    assertAssetPoolAccess,
    assertRequestInput(PostPayment.validation),
    requireAssetPoolHeader,
    PostPayment.controller,
);
router.get('/', assertScopes(['payments:read']), assertAssetPoolAccess, requireAssetPoolHeader, ListPayment.controller);

export default router;
