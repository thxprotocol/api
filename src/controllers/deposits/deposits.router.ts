import express from 'express';
import assertScopes from 'express-jwt-authz';
import { assertRequestInput, assertAssetPoolAccess, requireAssetPoolHeader } from '@/middlewares';
import CreateDepositController, { createDepositValidation } from './post.controller';

const router = express.Router();

router.post(
    '/',
    assertScopes(['user', 'deposits:read', 'deposits:write']),
    assertAssetPoolAccess,
    assertRequestInput(createDepositValidation),
    requireAssetPoolHeader,
    CreateDepositController,
);

export default router;
