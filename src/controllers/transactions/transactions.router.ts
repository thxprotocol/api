import express from 'express';
import { assertRequestInput, assertAssetPoolAccess, requireAssetPoolHeader, guard } from '@/middlewares';
import ListTransactions from './list.controller';

const router = express.Router();

router.get(
    '/',
    guard.check(['transactions:read']),
    requireAssetPoolHeader,
    assertAssetPoolAccess,
    assertRequestInput(ListTransactions.validation),
    ListTransactions.controller,
);

export default router;
