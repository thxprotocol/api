import { Router } from 'express';

import { upload } from '@/util/multer';

import PutArweave from './put.controller';

const router = Router();

router.put('/', upload.single('file'), PutArweave.controller);

export default router;
