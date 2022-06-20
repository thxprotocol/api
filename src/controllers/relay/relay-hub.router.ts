import express from 'express';

import { assertAssetPoolAccess, assertPlan, assertRequestInput, requireAssetPoolHeader, guard } from '@/middlewares';
import { AccountPlanType } from '@/types/enums';
import CreateRelay from './post.controller';
import CreateRelayUpgradeAddress from './upgrade_address/post';

const router = express.Router();

router.post(
    '/call',
    guard.check(['relay:write']),
    assertAssetPoolAccess,
    assertRequestInput(CreateRelay.validation),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    CreateRelay.controller,
);
router.post(
    '/upgrade_address',
    guard.check(['relay:write', 'account:write']),
    assertAssetPoolAccess,
    assertRequestInput(CreateRelayUpgradeAddress.validation),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    CreateRelay.controller,
);

export default router;
