import express from 'express';
import { getMetrics } from './get.action';

const router = express.Router();

router.get('/', getMetrics);

export default router;
