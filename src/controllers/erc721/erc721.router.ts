import express from 'express';
import assertScopes from 'express-jwt-authz';
import { assertRequestInput, requireAssetPoolHeader } from '@/middlewares';
import ReadERC721 from './get.controller';
import ListERC721 from './list.controller';
import ListERC721Metadata from './metadata/list.controller';
import CreateERC721 from './post.controller';
import CreateERC721Metadata from './metadata/post.controller';
import MintERC721Metadata from './metadata/mint/post.controller';
import { dashboardScopes, userDashboardScopes } from '../scopes';

const router = express.Router();

router.get('/', assertScopes(dashboardScopes), ListERC721.controller);
router.get(
    '/:id',
    assertScopes(userDashboardScopes),
    assertRequestInput(ReadERC721.validation),
    ReadERC721.controller,
);
router.post('/', assertScopes(dashboardScopes), assertRequestInput(CreateERC721.validation), CreateERC721.controller);
router.post(
    '/:id/metadata/:metadataId/mint',
    assertScopes(dashboardScopes),
    requireAssetPoolHeader,
    assertRequestInput(MintERC721Metadata.validation),
    MintERC721Metadata.controller,
);
router.get('/:id/metadata', assertScopes(dashboardScopes), ListERC721Metadata.controller);
router.post(
    '/:id/metadata',
    assertScopes(dashboardScopes),
    requireAssetPoolHeader,
    assertRequestInput(CreateERC721Metadata.validation),
    CreateERC721Metadata.controller,
);

export default router;
