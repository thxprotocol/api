import ERC721Service from '@/services/ERC721Service';
import { NotFoundError } from '@/util/errors';
import { Request, Response } from 'express';
import { param } from 'express-validator';
import { csvWriter } from '@/util/csv';
import path from 'path';

const validation = [param('id').isMongoId()];

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['ERC721']
    const erc721 = await ERC721Service.findById(req.params.id);
    if (!erc721) throw new NotFoundError('Could not find this NFT in the database');

    // RETRIEVE THE METADATA LIST
    const metadataList = await ERC721Service.findMetadataByNFT(erc721._id);
    console.log('metadataList', metadataList);

    // CREATE THE HEADER BASED ON THE ERC721 PROPERTIES
    const header = erc721.properties.map((x) => {
        return { id: x.name, title: x.name.toUpperCase() };
    });
    header.push({ id: 'id', title: 'MetadataID' });

    const csvPath = path.resolve(`./download/metadata_${erc721._id}.csv`);

    const writer = csvWriter.createObjectCsvWriter({
        path: csvPath,
        header,
    });

    // CREATE THE RECORDS
    const records: any = [];

    metadataList.forEach((x) => {
        const obj: any = {};
        x.attributes.forEach((a) => {
            obj[a.key] = a.value;
        });
        obj.id = x._id;
        records.push(obj);
    });

    await writer.writeRecords(records);

    res.status(200).json({});
};

export default { controller, validation };
