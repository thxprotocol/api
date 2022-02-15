import express from 'express';
import { parseHeader } from '@/util/network';
import { validate, validateAssetPoolHeader } from '@/util/validation';
import { validations } from './_.validation';
import { postCall } from './postCall.action';
import checkScopes from 'express-jwt-authz';
import { postCallUpgradeAddress } from './postCallUpgradeAddress.action';

const router = express.Router();

router.post(
    '/call',
    checkScopes(['user']),
    validateAssetPoolHeader,
    validate(validations.postCall),
    parseHeader,
    postCall,
);
router.post(
    '/upgrade_address',
    checkScopes(['user']),
    validateAssetPoolHeader,
    validate(validations.postCallUpgradeAddress),
    parseHeader,
    postCallUpgradeAddress,
);

export default router;
