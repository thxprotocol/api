import express from 'express';
import assertScopes from 'express-jwt-authz';
import { assertRequestInput } from '@/middlewares';
import { ReadERC721Controller, readERC721Validation } from './get.controller';
import { createERC721Validation, CreateERC721Controller } from './post.controller';
import { mintERC721TokenValidation, MintERC721TokenController } from './mint/post.controller';
import { ReadERC721MetadataController, readERC721MetadataValidation } from './metadata/get.controller';

const router = express.Router();

router.post('/', assertScopes(['dashboard']), assertRequestInput(createERC721Validation), CreateERC721Controller);
router.get('/:id', assertScopes(['dashboard']), assertRequestInput(readERC721Validation), ReadERC721Controller);
router.post(
    '/:id/mint',
    assertScopes(['dashboard']),
    assertRequestInput(mintERC721TokenValidation),
    MintERC721TokenController,
);
router.get(
    '/:id/metadata/:tokenId',
    assertScopes(['dashboard']),
    assertRequestInput(readERC721MetadataValidation),
    ReadERC721MetadataController,
);
export default router;
