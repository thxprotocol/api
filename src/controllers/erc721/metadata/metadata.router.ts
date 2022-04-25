import express from 'express';
import { assertRequestInput } from '@/middlewares';
import { ReadERC721MetadataController, readERC721MetadataValidation } from './get.controller';

const router = express.Router();

router.get('/:metadataId', assertRequestInput(readERC721MetadataValidation), ReadERC721MetadataController);

export default router;
