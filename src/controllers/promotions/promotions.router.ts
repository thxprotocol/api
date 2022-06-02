import express from 'express';
import assertScopes from 'express-jwt-authz';
import { assertAssetPoolAccess, assertRequestInput, requireAssetPoolHeader } from '@/middlewares';
import CreatePromotion from './post.controller';
import ReadPromotion from './get.controller';
import ListPromotion from './list.controller';
import DeletePromotion from './delete.controller';
import { dashboardScopes, userDashboardScopes } from '../scopes';

const router = express.Router();

router.post(
    '/',
    assertAssetPoolAccess,
    assertScopes(dashboardScopes),
    assertRequestInput(CreatePromotion.validation),
    requireAssetPoolHeader,
    CreatePromotion.controller,
);
router.get(
    '/',
    assertAssetPoolAccess,
    assertScopes(userDashboardScopes),
    assertRequestInput(ListPromotion.validation),
    requireAssetPoolHeader,
    ListPromotion.controller,
);
router.get(
    '/:id',
    assertAssetPoolAccess,
    assertScopes(dashboardScopes),
    assertRequestInput(ReadPromotion.validation),
    requireAssetPoolHeader,
    ReadPromotion.controller,
);
router.delete(
    '/:id',
    assertAssetPoolAccess,
    assertScopes(['dashboard', 'promotions:read', 'promotions:write']),
    assertRequestInput(DeletePromotion.validation),
    requireAssetPoolHeader,
    DeletePromotion.controller,
);

export default router;
