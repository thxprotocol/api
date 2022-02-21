import express from 'express';
import { createCallValidation, postCall } from './post.controller';
import assertScopes from 'express-jwt-authz';
import { createCallUpgradeAddressValidation, postCallUpgradeAddress } from './upgrade_address/post';
import { assertAssetPoolAccess, assertRequestInput, requireAssetPoolHeader } from '@/middlewares';

const router = express.Router();

router.post(
    '/call',
    assertScopes(['user']),
    assertAssetPoolAccess,
    assertRequestInput(createCallValidation),
    requireAssetPoolHeader,
    postCall,
);
router.post(
    '/upgrade_address',
    assertScopes(['user']),
    assertAssetPoolAccess,
    assertRequestInput(createCallUpgradeAddressValidation),
    requireAssetPoolHeader,
    postCallUpgradeAddress,
);

export default router;
