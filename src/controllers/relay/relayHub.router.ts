import express from 'express';
import { createCallValidation, postCall } from './post.controller';
import assertScopes from 'express-jwt-authz';
import { createCallUpgradeAddressValidation, postCallUpgradeAddress } from './upgrade_address/post';
import { assertAssetPoolAccess, assertPlan, assertRequestInput, requireAssetPoolHeader } from '@/middlewares';
import { AccountPlanType } from '@/types/enums';

const router = express.Router();

router.post(
    '/call',
    assertScopes(['user']),
    assertAssetPoolAccess,
    assertRequestInput(createCallValidation),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Community, AccountPlanType.Creator]),
    postCall,
);
router.post(
    '/upgrade_address',
    assertScopes(['user']),
    assertAssetPoolAccess,
    assertRequestInput(createCallUpgradeAddressValidation),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Community, AccountPlanType.Creator]),
    postCallUpgradeAddress,
);

export default router;
