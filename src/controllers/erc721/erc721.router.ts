import express, { Request, Response } from 'express';
import { assertRequestInput, requireAssetPoolHeader, guard } from '@/middlewares';
import ReadERC721 from './get.controller';
import ListERC721 from './list.controller';
import ListERC721Metadata from './metadata/list.controller';
import ListERC721Token from './token/list.controller';
import ReadERC721Token from './token/get.controller';
import CreateERC721 from './post.controller';
import CreateERC721Metadata from './metadata/post.controller';
import MintERC721Metadata from './metadata/mint/post.controller';
import CreateMultipleERC721Metadata from './metadata/images/post.controller';
import DownloadERC721MetadataCSV from './metadata/csv/get.controller';
import UploadERC721MetadataCSV from './metadata/csv/post.controller';
import { upload } from '@/util/multer';
import UpdateERC721 from './patch.controller';
import { validationResult } from 'express-validator';

const router = express.Router();

router.get('/token', guard.check(['erc721:read']), ListERC721Token.controller);
router.get('/token/:id', guard.check(['erc721:read']), ReadERC721Token.controller);
router.get('/', guard.check(['erc721:read']), assertRequestInput(ListERC721.validation), ListERC721.controller);
router.get('/:id', guard.check(['erc721:read']), assertRequestInput(ReadERC721.validation), ReadERC721.controller);
router.post(
    '/',
    guard.check(['erc721:read', 'erc721:write']),
    assertRequestInput(CreateERC721.validation),
    CreateERC721.controller,
);
router.post('/', guard.check(['erc721:write']), assertRequestInput(CreateERC721.validation), CreateERC721.controller);

router.post(
    '/:id/metadata',
    guard.check(['erc721:read', 'erc721:write']),
    requireAssetPoolHeader,
    upload.single('file'),
    async (req: any, res: any, next: any) => {
        let controller;

        if (req.file) {
            switch (req.file.mimetype) {
                case 'application/zip':
                    controller = CreateMultipleERC721Metadata;
                    break;
                case 'text/csv':
                    controller = UploadERC721MetadataCSV;
            }
        } else {
            controller = CreateERC721Metadata;
        }
        return await callController(controller, req, res);
    },
);

router.post(
    '/:id/metadata/:metadataId/mint',
    guard.check(['erc721:write']),
    requireAssetPoolHeader,
    assertRequestInput(MintERC721Metadata.validation),
    MintERC721Metadata.controller,
);
router.get('/:id/metadata', guard.check(['erc721:read']), ListERC721Metadata.controller);
router.post(
    '/:id/metadata/single',
    guard.check(['erc721:write']),
    requireAssetPoolHeader,
    assertRequestInput(CreateERC721Metadata.validation),
    CreateERC721Metadata.controller,
);
router.post(
    '/:id/metadata/multiple',
    upload.single('file'),
    guard.check(['erc721:write']),
    requireAssetPoolHeader,
    assertRequestInput(CreateMultipleERC721Metadata.validation),
    CreateMultipleERC721Metadata.controller,
);
router.get(
    '/:id/metadata/csv',
    guard.check(['erc721:read']),
    requireAssetPoolHeader,
    assertRequestInput(DownloadERC721MetadataCSV.validation),
    DownloadERC721MetadataCSV.controller,
);
router.post(
    '/:id/metadata/csv',
    upload.single('file'),
    guard.check(['erc721:read', 'erc721:write']),
    requireAssetPoolHeader,
    assertRequestInput(UploadERC721MetadataCSV.validation),
    UploadERC721MetadataCSV.controller,
);
router.patch(
    '/:id',
    guard.check(['erc721:write', 'erc721:read']),
    assertRequestInput(UpdateERC721.validation),
    UpdateERC721.controller,
);

async function callController(constroller: any, req: Request, res: Response) {
    await Promise.all(constroller.validation.map((chain: any) => chain.run(req)));
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return await constroller.controller(req, res);
    }
    res.status(400).json({ errors: errors.array() });
}

export default router;
