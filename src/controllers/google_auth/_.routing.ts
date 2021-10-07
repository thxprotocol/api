import express from 'express';
import { googleCallback } from '../google_auth/googleCallback.action';


const router = express.Router();
router.get('/', googleCallback);

export default router;
