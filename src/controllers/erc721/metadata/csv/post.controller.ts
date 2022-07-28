import ERC721Service from '@/services/ERC721Service';
import { BadRequestError, NotFoundError } from '@/util/errors';
import { Request, Response } from 'express';
import { check, param } from 'express-validator';
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

        // GET THE ERC721 PROPERTIES FOR HEADER VALIDATION
        const properties = erc721.properties.map((x) => x.name);
        properties.push('MetadataID');

        const readeableStream = Readable.from(req.file.buffer.toString());

        const promises: Promise<any>[] = [];

        readeableStream
            .pipe(new CsvReadableStream({ skipHeader: true, asObject: true }))
            .on('header', (header) => {
                // HEADER VALIDATION
                if (header.length != properties.length) {
                    throw new BadRequestError('Invalid CSV schema: length');
                }
                for (let i = 0; i < header.length; i++) {
                    if (properties[i] != header[i]) {
                        throw new BadRequestError(`Invalid CSV schema: property: ${header[i]}`);
                    }
                }
            })

            .on('data', async (row: any) => {
                const promise = new Promise(async (resolve, reject) => {
                    try {
                        // MAP THE RECORDS TO ATTRIBUTES
                        const attributes: { key: string; value: any }[] = [];
                        for (const [key, value] of Object.entries(row)) {
                            if (key != 'MetadataID') {
                                attributes.push({ key, value });
                            }
                        }

                        // CHECK IF THE METADATA IS PRESENT IN THE DB
                        const metadata = await ERC721Service.findMetadataById(row.MetadataID);

                        // IF PRESENT, UPDATE THE DOCUMENT
                        if (metadata) {
                            metadata.attributes = attributes;
                            metadata.save();
                        } else {
                            // CREATE NEW METADATA
                            ERC721Service.createMetadata(erc721, '', '', attributes);
                        }
                        resolve(true);
                    } catch (err) {
                        reject(err);
                    }
                });
                promises.push(promise);
            })
            .on('error', (err) => {
                let status = 500;
                if (err.message.includes('Invalid CSV schema')) {
                    status = 400;
                }
                res.status(status).json({ message: err.message }).end();
            })
            .on('end', async () => {
                await Promise.all(promises);
                res.status(201).json({}).end();
            });
    } catch (err) {
        logger.error(err);
        throw err;
    }
};

export default { controller, validation };
