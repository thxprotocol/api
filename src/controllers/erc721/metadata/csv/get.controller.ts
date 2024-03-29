import ERC721Service from '@/services/ERC721Service';
import { NotFoundError } from '@/util/errors';
import { Request, Response } from 'express';
import { param } from 'express-validator';
import * as csvWriter from 'csv-writer';
import { AWS_S3_PUBLIC_BUCKET_NAME } from '@/config/secrets';
import { s3Client } from '@/util/s3';
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { logger } from '@/util/logger';
import { ERC721Metadata } from '@/models/ERC721Metadata';

const validation = [param('id').isMongoId()];

const controller = async (req: Request, res: Response) => {
    try {
        // #swagger.tags = ['ERC721']
        const erc721 = await ERC721Service.findById(req.params.id);
        if (!erc721) throw new NotFoundError('Could not find this NFT in the database');

        // RETRIEVE THE METADATA LIST
        const metadataList = await ERC721Metadata.find({ erc721: erc721._id });

        // CREATE THE CSV HEADER BASED ON THE ERC721 PROPERTIES
        const header = erc721.properties.map((x) => {
            return { id: x.name, title: x.name };
        });
        header.push({ id: 'id', title: 'MetadataID' });

        // CREATE THE CSV RECORDS
        const records: any = [];

        metadataList.forEach((x) => {
            const obj: any = {};
            x.attributes.forEach((a: any) => {
                obj[a.key] = a.value;
            });
            obj.id = x._id;
            records.push(obj);
        });

        // CREATE THE CSV CONTENT
        const csvStringifier = csvWriter.createObjectCsvStringifier({
            header,
        });
        const csvContent = `${csvStringifier.getHeaderString()}${csvStringifier.stringifyRecords(records)}`;

        // CREATE BUFFER FROM STRING
        const buffer = Buffer.from(csvContent, 'utf-8');

        // PREPARE PARAMS FOR UPLOAD TO S3 BUCKET
        const csvFileName = `metadata_${erc721._id}.csv`;
        const uploadParams = {
            Key: csvFileName,
            Bucket: AWS_S3_PUBLIC_BUCKET_NAME,
            ACL: 'public-read',
            Body: buffer,
        };

        // UPLOAD THE FILE TO S3
        await s3Client.send(new PutObjectCommand(uploadParams));

        // GET THE FILE
        const response = await s3Client.send(
            new GetObjectCommand({
                Bucket: AWS_S3_PUBLIC_BUCKET_NAME,
                Key: csvFileName,
            }),
        );

        // RETURN THE FILE TO THE RESPONSE
        (response.Body as Readable).pipe(res).attachment(csvFileName);
    } catch (err) {
        logger.error(err);
        throw err;
    }
};

export default { controller, validation };
