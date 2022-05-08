import express from 'express';
import { getMetrics } from './get.controller';

const router = express.Router();

router.get('/', getMetrics);

export default router;
