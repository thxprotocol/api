import express from 'express';
import assertScopes from 'express-jwt-authz';
import { assertAssetPoolAccess, assertRequestInput, requireAssetPoolHeader } from '@/middlewares';
import CreatePromotion from './post.controller';
import ReadPromotion from './get.controller';
import ListPromotion from './list.controller';
import DeletePromotion from './delete.controller';

const router = express.Router();

router.post(
    '/',
    assertAssetPoolAccess,
    assertScopes(['promotions:read', 'promotions:write']),
    assertRequestInput(CreatePromotion.validation),
    requireAssetPoolHeader,
    CreatePromotion.controller,
);
router.get(
    '/',
    assertAssetPoolAccess,
    assertScopes(['promotions:read']),
    assertRequestInput(ListPromotion.validation),
    requireAssetPoolHeader,
    ListPromotion.controller,
);
router.get(
    '/:id',
    assertAssetPoolAccess,
    assertScopes(['promotions:read']),
    assertRequestInput(ReadPromotion.validation),
    requireAssetPoolHeader,
    ReadPromotion.controller,
);
router.delete(
    '/:id',
    assertAssetPoolAccess,
    assertScopes(['promotions:write']),
    assertRequestInput(DeletePromotion.validation),
    requireAssetPoolHeader,
    DeletePromotion.controller,
);

export default router;
