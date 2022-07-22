import { AWS_S3_PUBLIC_BUCKET_NAME } from '@/config/secrets';
import ERC721Service from '@/services/ERC721Service';
import ImageService from '@/services/ImageService';
import { NotFoundError } from '@/util/errors';
import { s3Client } from '@/util/s3';
import { zip } from '@/util/zip';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { Request, Response } from 'express';
import { body, check, param } from 'express-validator';
import short from 'short-uuid';

const validation = [
    param('id').isMongoId(),
    body('title').isString().isLength({ min: 0, max: 100 }),
    body('description').isString().isLength({ min: 0, max: 400 }),
    body('propName').exists().isString(),
    check('compressedFile').custom((value, { req }) => {
        switch (req.file.mimetype) {
            case 'application/x-rar-compressed':
            case 'application/octet-stream':
            case 'application/zip':
            case 'application/rar':
                return true;
            default:
                return false;
        }
    }),
];

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['ERC721']
    const erc721 = await ERC721Service.findById(req.params.id);
    if (!erc721) throw new NotFoundError('Could not find this NFT in the database');

    // UNZIP THE FILE
    const urls: string[] = [];
    const contents = await zip.loadAsync(req.file.buffer);

    // LOAD ZIP IN MEMORY
    console.log('Object.keys(contents.files)', Object.keys(contents.files));
    const objectKeys = Object.keys(contents.files);

    for (let i = 0; i < objectKeys.length; i++) {
        const file = objectKeys[i];
        const [originalFileName, extension] = file.split('.');

        if (!isValidExtension(extension)) {
            continue;
        }
        // FORMAT FILENAME
        const filename =
            originalFileName.toLowerCase().split(' ').join('-').split('.') + '-' + short.generate() + `.${extension}`;

        // CREATE THE FILE STTREAM
        const stream = await zip.file(file).async('nodebuffer');

        // PREPARE UPLOAD PARAMS FOR UPLOAD TO S3 BUCKET
        const uploadParams = {
            Key: filename,
            Bucket: AWS_S3_PUBLIC_BUCKET_NAME,
            ACL: 'public-read',
            Body: stream,
        };
        console.log('uploadParams', uploadParams);

        // UPLOAD THE FILE
        await s3Client.send(new PutObjectCommand(uploadParams));

        // COLLECT THE URLS
        const url = ImageService.getPublicUrl(filename);

        // CREATE THE METADATA
        await ERC721Service.createMetadata(erc721, req.body.title, req.body.description, [
            { key: req.body.propName, value: url },
        ]);

        urls.push(url);
    }

    console.log('URLS', urls);
    res.status(201).json({ urls });
};
function isValidExtension(extension: string) {
    const allowedExtensions = ['jpg', 'jpeg', 'gif', 'png'];
    return allowedExtensions.includes(extension);
}
export default { controller, validation };
