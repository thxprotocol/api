import ERC721Service from '@/services/ERC721Service';
import { Request, Response } from 'express';
import { body, param } from 'express-validator';
import { NotFoundError } from '@/util/errors';
import { ERC721MetadataDocument } from '@/models/ERC721Metadata';

const validation = [param('id').isMongoId(), param('metadataId').isMongoId(), body('recipient').isEthereumAddress()];

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['ERC721']
    const erc721 = await ERC721Service.findById(req.params.id);
    if (!erc721) throw new NotFoundError('Could not find this NFT in the database');

    let erc721metadata: ERC721MetadataDocument = await ERC721Service.findMetadataById(req.params.metadataId);
    if (!erc721metadata) throw new NotFoundError('Could not find this NFT metadata in the database');

    erc721metadata = await ERC721Service.mint(req.assetPool, erc721, erc721metadata, req.body.recipient);

    res.status(201).json(erc721metadata);
};

export default { controller, validation };
