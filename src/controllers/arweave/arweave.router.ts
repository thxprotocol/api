import { Router } from 'express';

import { upload } from '@/util/multer';

import GetArweave from './get.controller';
import PutArweave from './put.controller';

const router = Router();

router.put('/', upload.single('file'), PutArweave.controller);
router.get('/:id', GetArweave.controller);

export default router;
