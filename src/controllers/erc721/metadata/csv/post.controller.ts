import ERC721Service from '@/services/ERC721Service';
import { NotFoundError } from '@/util/errors';

import { Request, Response } from 'express';
import { check, param } from 'express-validator';
import { csvWriter } from '@/util/csv';
import { AWS_S3_PUBLIC_BUCKET_NAME } from '@/config/secrets';
import ImageService from '@/services/ImageService';
import { s3Client } from '@/util/s3';
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

import { Readable } from 'stream';
import { logger } from '@/util/logger';
import CsvReadableStream from 'csv-reader';

const validation = [
    param('id').isMongoId(),
    check('csvFile').custom((value, { req }) => {
        switch (req.file.mimetype) {
            case 'text/csv':
                return true;
            default:
                return false;
        }
    }),
];

const controller = async (req: Request, res: Response) => {
    try {
        // #swagger.tags = ['ERC721']
        const erc721 = await ERC721Service.findById(req.params.id);
        if (!erc721) throw new NotFoundError('Could not find this NFT in the database');

        // RETRIEVE THE METADATA LIST TO VALIDATE THE SCHEMA
        const metadataList = await ERC721Service.findMetadataByNFT(erc721._id);

        // GET THE ERC721 PROPERTIES FOR HEADER VALIDATION
        const properties = erc721.properties.map((x) => x.name);
        properties.push('MetadataID');
        console.log('PROPERTIES', properties);
        const readeableStream = Readable.from(req.file.buffer.toString());

        readeableStream
            .pipe(new CsvReadableStream({ skipHeader: true, asObject: true }))
            .on('header', (header) => {
                // HEADER VALIDATION
                if (header.length != properties.length) {
                    throw new Error('Invalid CSV schema: length');
                }
                for (let i = 0; i < header.length; i++) {
                    if (properties[i] != header[i]) {
                        throw new Error(`Invalid CSV schema: property: ${header[i]}`);
                    }
                }
            })
            .on('data', async (row: any) => {
                // MAP THE RECORDS TO ATTRIBUTES
                const attributes: { key: string; value: any }[] = [];
                for (const [key, value] of Object.entries(row)) {
                    if (key != 'MetadataID') {
                        attributes.push({ key, value });
                    }
                }
                console.log('attributes', attributes);

                // CHECK IF THE METADATA IS PRESENT IN THE DB
                const metadata = await ERC721Service.findMetadataById(row.MetadataID);

                // IF PRESENT, UPDATE THE DOCUMENT
                if (metadata) {
                    metadata.attributes = attributes;
                    await metadata.save();
                } else {
                    // CREATE NEW METADATA
                    await ERC721Service.createMetadata(erc721, '', '', attributes);
                }
            });
        res.status(201).json({});
    } catch (err) {
        logger.error(err);
        throw err;
    }
};

export default { controller, validation };
