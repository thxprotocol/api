import express from 'express';
import { assertRequestInput, guard, requireAssetPoolHeader } from '@/middlewares';
import ReadERC721Metadata from './get.controller';

const router = express.Router();

router.get('/:metadataId', assertRequestInput(ReadERC721Metadata.validation), ReadERC721Metadata.controller);

export default router;
