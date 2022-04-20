import { validate } from '@/util/validation';
import express from 'express';
import { getReward } from '../rewards/getReward.action';
import { validations } from '../rewards/_.validation';

const router = express.Router();

router.get('claim/:id', validate(validations.getReward), getReward);

export default router;
