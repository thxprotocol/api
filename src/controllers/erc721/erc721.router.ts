import express from 'express';
import assertScopes from 'express-jwt-authz';
import { assertRequestInput, requireAssetPoolHeader } from '@/middlewares';
import ReadERC721 from './get.controller';
import ListERC721 from './list.controller';
import ListERC721Metadata from './metadata/list.controller';
import ListERC721Token from './token/list.controller';
import ReadERC721Token from './token/get.controller';
import CreateERC721 from './post.controller';
import CreateERC721Metadata from './metadata/post.controller';
import MintERC721Metadata from './metadata/mint/post.controller';

const router = express.Router();

router.get('/token', assertScopes(['erc721:read']), ListERC721Token.controller);
router.get('/token/:id', assertScopes(['erc721:read']), ReadERC721Token.controller);
router.get('/', assertScopes(['erc721:read']), ListERC721.controller);
router.get('/:id', assertScopes(['erc721:read']), assertRequestInput(ReadERC721.validation), ReadERC721.controller);
router.post(
    '/',
    assertScopes(['erc721:read', 'erc721:write']),
    assertRequestInput(CreateERC721.validation),
    CreateERC721.controller,
);
router.post('/', assertScopes(['erc721:write']), assertRequestInput(CreateERC721.validation), CreateERC721.controller);
router.post(
    '/:id/metadata/:metadataId/mint',
    assertScopes(['erc721:write']),
    requireAssetPoolHeader,
    assertRequestInput(MintERC721Metadata.validation),
    MintERC721Metadata.controller,
);
router.get('/:id/metadata', assertScopes(['erc721:read']), ListERC721Metadata.controller);
router.post(
    '/:id/metadata',
    assertScopes(['erc721:write']),
    requireAssetPoolHeader,
    assertRequestInput(CreateERC721Metadata.validation),
    CreateERC721Metadata.controller,
);

export default router;
