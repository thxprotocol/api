import { param } from 'express-validator';
import { Request, Response } from 'express';
import { TERC721 } from '@/types/TERC721';
import ERC721Service from '@/services/ERC721Service';
import { NotFoundError } from '@/util/errors';

export const readERC721MetadataValidation = [param('id').isString().isMongoId(), param('tokenId').isNumeric()];

export const ReadERC721MetadataController = async (req: Request, res: Response) => {
    const erc721 = await ERC721Service.findById(req.params.id);
    if (!erc721) throw new NotFoundError();

    const metadata = await ERC721Service.getMetadata(erc721, Number(req.params.tokenId));

    res.json(metadata);
};
