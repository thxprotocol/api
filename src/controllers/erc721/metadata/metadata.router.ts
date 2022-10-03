import express from 'express';
import { assertRequestInput } from '@/middlewares';
import ReadERC721MetadataAttributes from './attributes/get.controller';
const router = express.Router();

router.get(
    '/:metadataId',
    assertRequestInput(ReadERC721MetadataAttributes.validation),
    ReadERC721MetadataAttributes.controller,
);

export default router;
