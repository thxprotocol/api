import express from 'express';
import assertScopes from 'express-jwt-authz';
import { assertRequestInput, requireAssetPoolHeader } from '@/middlewares';
import { ReadERC721Controller, readERC721Validation } from './get.controller';
import { ListERC721Controller } from './list.controller';
import { ListERC721MetadataController } from './metadata/list.controller';
import { createERC721Validation, CreateERC721Controller } from './post.controller';
import { CreateERC721MetadataController, createERC721MetadataValidation } from './metadata/post.controller';
import { MintERC721MetadataController, mintERC721MetadataValidation } from './metadata/mint/post.controller';

const router = express.Router();

router.get('/', assertScopes(['dashboard']), ListERC721Controller);
router.get('/:id', assertScopes(['dashboard', 'user']), assertRequestInput(readERC721Validation), ReadERC721Controller);
router.post('/', assertScopes(['dashboard']), assertRequestInput(createERC721Validation), CreateERC721Controller);
router.post(
    '/:id/metadata/:metadataId/mint',
    assertScopes(['dashboard']),
    requireAssetPoolHeader,
    assertRequestInput(mintERC721MetadataValidation),
    MintERC721MetadataController,
);
router.get('/:id/metadata', assertScopes(['dashboard']), ListERC721MetadataController);
router.post(
    '/:id/metadata',
    assertScopes(['dashboard']),
    requireAssetPoolHeader,
    assertRequestInput(createERC721MetadataValidation),
    CreateERC721MetadataController,
);

export default router;
