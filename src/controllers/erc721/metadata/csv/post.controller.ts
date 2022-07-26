import ERC721Service from '@/services/ERC721Service';
import { NotFoundError } from '@/util/errors';

import { Request, Response } from 'express';
import { check, param } from 'express-validator';
import { csvWriter } from '@/util/csv';
import path from 'path';

const validation = [
    param('id').isMongoId(),
    check('csvFile').custom((value, { req }) => {
        switch (req.file.mimetype) {
            case 'application/octet-stream':
            case 'text/csv':
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

    // RETRIEVE THE METADATA LIST
    const metadataList = await ERC721Service.findMetadataByNFT(erc721._id);

    // CREATE THE HEADER WITH THE ERC721 PROPERTIES
    const header = erc721.properties.map((x) => {
        return { id: x.name, title: x.name.toUpperCase() };
    });
    console.log('HEADER', header);

    const csvPath = path.resolve(`./downloads/metadata_${erc721._id}.csv`);

    const writer = csvWriter.createObjectCsvWriter({
        path: csvPath,
        header,
    });

    const records = metadataList.map((x) => {
        return {
            ...x.attributes,
            ID: x.id,
        };
    });
    console.log('RECORDS', records);

    await writer.writeRecords(records);

    console.log('CSV CREATED!', csvPath);

    res.status(201).json({});
};

export default { controller, validation };
