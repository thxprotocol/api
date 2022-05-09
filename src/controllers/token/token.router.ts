import express from 'express';

import ReadToken from './get.controller';

const router = express.Router();

router.get('/cs', ReadToken.controller);

export default router;
