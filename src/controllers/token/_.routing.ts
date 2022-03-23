import express from 'express';
import checkScopes from 'express-jwt-authz';

import erc20Route from './erc20/_.routing';
import { getCirculatingSupply } from './getToken.action';

const router = express.Router();

router.get('/cs', getCirculatingSupply);
router.use('/erc20', checkScopes(['dashboard']), erc20Route);

export default router;
