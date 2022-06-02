import express from 'express';
import assertScopes from 'express-jwt-authz';
import { assertAssetPoolAccess, assertPlan, assertRequestInput, requireAssetPoolHeader } from '@/middlewares';
import { AccountPlanType } from '@/types/enums';
import CreateRelay from './post.controller';
import CreateRelayUpgradeAddress from './upgrade_address/post';
import { userScopes } from '../scopes';

const router = express.Router();

router.post(
    '/call',
    assertScopes(userScopes),
    assertAssetPoolAccess,
    assertRequestInput(CreateRelay.validation),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    CreateRelay.controller,
);
router.post(
    '/upgrade_address',
    assertScopes(userScopes),
    assertAssetPoolAccess,
    assertRequestInput(CreateRelayUpgradeAddress.validation),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    CreateRelay.controller,
);

export default router;
