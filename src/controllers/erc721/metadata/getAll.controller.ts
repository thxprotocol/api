import { Request, Response } from 'express';
import ERC721Service from '@/services/ERC721Service';
import { ERC721MetadataDocument } from '@/models/ERC721Metadata';
import { param } from 'express-validator';
import { NotFoundError } from '@/util/errors';

export const listERC721MetadataValidation = [param('id').isMongoId()];

export const ListERC721MetadataController = async (req: Request, res: Response) => {
    const erc721 = await ERC721Service.findById(req.params.id);
    if (!erc721) throw new NotFoundError('Could not find this NFT in the database');

    const result: ERC721MetadataDocument[] = await ERC721Service.findMetadataByNFT(erc721._id);

    res.json(result);
};
