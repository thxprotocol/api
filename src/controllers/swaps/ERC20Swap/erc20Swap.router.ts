import express from 'express';
import assertScopes from 'express-jwt-authz';
import CreateERC20Swap from './post.controller';
import ReadERC20Swap from './get.controller';
import ListERC20Swaps from './list.controller';
import { assertRequestInput, assertAssetPoolAccess, requireAssetPoolHeader, assertPlan } from '@/middlewares';
import { AccountPlanType } from '@/types/enums';

const router = express.Router();

router.get(
    '/',
    assertScopes(['swap:read']),
    assertAssetPoolAccess,
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    ListERC20Swaps.controller,
);
router.get(
    '/:id',
    assertScopes(['swap:read']),
    assertAssetPoolAccess,
    assertRequestInput(ReadERC20Swap.validation),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    ReadERC20Swap.controller,
);
router.post(
    '/',
    assertScopes(['swap:write', 'swap:read']),
    assertAssetPoolAccess,
    assertRequestInput(CreateERC20Swap.validation),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    CreateERC20Swap.controller,
);

export default router;
