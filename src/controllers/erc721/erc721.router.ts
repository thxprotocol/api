import express from 'express';
import assertScopes from 'express-jwt-authz';
import { assertRequestInput, requireAssetPoolHeader } from '@/middlewares';
import { ReadERC721Controller, readERC721Validation } from './get.controller';
import { ListERC721Controller } from './getAll.controller';
import { ListERC721MetadataController } from './metadata/getAll.controller';
import { createERC721Validation, CreateERC721Controller } from './post.controller';
import { mintERC721TokenValidation, MintERC721TokenController } from './mint/post.controller';

const router = express.Router();

router.get('/', assertScopes(['dashboard']), ListERC721Controller);
router.get('/:id', assertScopes(['dashboard']), assertRequestInput(readERC721Validation), ReadERC721Controller);
router.post('/', assertScopes(['dashboard']), assertRequestInput(createERC721Validation), CreateERC721Controller);
router.post(
    '/:id/mint',
    assertScopes(['dashboard']),
    requireAssetPoolHeader,
    assertRequestInput(mintERC721TokenValidation),
    MintERC721TokenController,
);
router.get('/:id/metadata', assertScopes(['dashboard']), ListERC721MetadataController);

export default router;
