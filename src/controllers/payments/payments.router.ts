import express from 'express';
import assertScopes from 'express-jwt-authz';
import { assertRequestInput, assertAssetPoolAccess, requireAssetPoolHeader } from '@/middlewares';
import PostPayment from './post.controller';
import PostPaymentPay from './pay/post.controller';
import ReadPayment from './get.action';

const router = express.Router();

router.post(
    '/',
    assertScopes(['admin']),
    assertAssetPoolAccess,
    assertRequestInput(PostPayment.validation),
    requireAssetPoolHeader,
    PostPayment.controller,
);
router.post(
    '/:id/pay',
    assertScopes(['user']),
    assertRequestInput(PostPaymentPay.validation),
    requireAssetPoolHeader,
    PostPaymentPay.controller,
);
// router.get(
//     '/',
//     assertScopes(['admin']),
//     assertAssetPoolAccess,
//     assertRequestInput(ListPayment.validation),
//     requireAssetPoolHeader,
//     ListPayment.controller,
// );
router.get(
    '/:id',
    assertScopes(['admin']),
    assertAssetPoolAccess,
    assertRequestInput(ReadPayment.validation),
    requireAssetPoolHeader,
    ReadPayment.controller,
);

export default router;
