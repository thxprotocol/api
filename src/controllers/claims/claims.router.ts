import express from 'express';
import { assertRequestInput, guard } from '@/middlewares';
import ReadClaim from './get.controller';
import ReadClaimHash from './hash/get.controller';
import PostClaimCollect from './collect/post.controller';

const router = express.Router();

router.post(
    '/:id/collect',
    guard.check(['claims:read']),
    assertRequestInput(PostClaimCollect.validation),
    PostClaimCollect.controller,
);
router.get('/:id', guard.check(['claims:read']), assertRequestInput(ReadClaim.validation), ReadClaim.controller);
router.get(
    '/hash/:hash',
    guard.check(['claims:read']),
    assertRequestInput(ReadClaimHash.validation),
    ReadClaimHash.controller,
);

export default router;
