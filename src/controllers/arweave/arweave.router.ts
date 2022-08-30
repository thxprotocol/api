import { Router } from 'express';
import { assertRequestInput } from '@/middlewares';
import { upload } from '@/util/multer';

import PutArweave from './put.controller';
import ReadArweave from './get.controller';

const router = Router();

router.put('/', upload.single('file'), PutArweave.controller);

router.get('/:id', assertRequestInput(ReadArweave.validation), ReadArweave.controller);

export default router;
