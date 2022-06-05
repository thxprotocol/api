import express from 'express';
import assertScopes from 'express-jwt-authz';
import { assertRequestInput, assertAssetPoolAccess, requireAssetPoolHeader} from '@/middlewares';
import ListTransactions from './list.controller';

const router = express.Router();
router.get(
    '/',
    assertAssetPoolAccess,
    assertScopes(['dashboard']),
    assertRequestInput(ListTransactions.validation),
    requireAssetPoolHeader,
    ListTransactions.controller,
);
export default router;
