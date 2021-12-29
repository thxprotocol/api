import express from 'express';
import { getCirculatingSupply } from './getToken.action';

const router = express.Router();

router.get('/cs', getCirculatingSupply);

export default router;
