import express from 'express';
import { assertRequestInput, guard, requireAssetPoolHeader } from '@/middlewares';
import ReadERC721Metadata from './get.controller';
import CreateMultipleERC721Metadata from './multiple/post.controller';
import { upload } from '@/util/multer';

const router = express.Router();

router.get('/:metadataId', assertRequestInput(ReadERC721Metadata.validation), ReadERC721Metadata.controller);
router.post(
    '/multiple',
    upload.single('compressedFile'),
    //guard.check(['erc721:write']),
    requireAssetPoolHeader,
    assertRequestInput(CreateMultipleERC721Metadata.validation),
    CreateMultipleERC721Metadata.controller,
);
export default router;
