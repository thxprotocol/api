import express from 'express';

import { getCirculatingSupply } from './get.controller';

const router = express.Router();

router.get('/cs', getCirculatingSupply);

export default router;
