import ERC721Service from '@/services/ERC721Service';
import { Request, Response } from 'express';
import { body, param } from 'express-validator';
import { NotFoundError } from '@/util/errors';

export const createERC721MetadataValidation = [
    param('id').isMongoId(),
    body('metadata').exists(),
    body('beneficiary').optional().isEthereumAddress(),
];

export const CreateERC721MetadataController = async (req: Request, res: Response) => {
    const erc721 = await ERC721Service.findById(req.params.id);
    if (!erc721) throw new NotFoundError('Could not find this NFT in the database');

    // TODO Validate the metadata with the schema configured in the collection here
    let erc721metadata = await ERC721Service.createMetadata(erc721, req.body.metadata);
    if (req.body.beneficiary) {
        erc721metadata = await ERC721Service.mint(req.assetPool, erc721, erc721metadata, req.body.beneficiary);
    }

    res.status(201).json(erc721metadata);
};
