import express from 'express';

import { getCirculatingSupply } from './getToken.action';

import erc20Route from './erc20/_.routing';

const router = express.Router();

router.get('/cs', getCirculatingSupply);
router.use('/erc20', erc20Route);

export default router;
