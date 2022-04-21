import { param } from 'express-validator';
import { Request, Response } from 'express';
import ERC721Service from '@/services/ERC721Service';
import { NotFoundError } from '@/util/errors';

export const readERC721MetadataValidation = [param('id').isString().isMongoId(), param('metadataId').isMongoId()];

export const ReadERC721MetadataController = async (req: Request, res: Response) => {
    const erc721 = await ERC721Service.findById(req.params.id);
    if (!erc721) throw new NotFoundError();

    const entry = await ERC721Service.findMetadataById(req.params.metadataId);
    const metadata = await ERC721Service.parseMetadata(entry);

    res.json(metadata);
};
