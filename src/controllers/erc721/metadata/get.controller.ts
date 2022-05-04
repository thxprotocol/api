import { param } from 'express-validator';
import { Request, Response } from 'express';
import ERC721Service from '@/services/ERC721Service';

export const readERC721MetadataValidation = [param('metadataId').isMongoId()];

export const ReadERC721MetadataController = async (req: Request, res: Response) => {
    const entry = await ERC721Service.findMetadataById(req.params.metadataId);
    const attributes = await ERC721Service.parseAttributes(entry);

    res.header('Content-Type', 'application/json').send(JSON.stringify(attributes, null, 4));
};
