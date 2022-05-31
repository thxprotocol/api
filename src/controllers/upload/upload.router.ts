import { Router } from 'express';

import { upload } from '@/util/multer';

import PutUpload from './put.controller';

const router = Router();

router.put('/', upload.single('file'), PutUpload.controller);

export default router;
