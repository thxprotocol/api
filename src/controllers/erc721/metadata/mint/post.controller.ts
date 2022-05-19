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

    const metadata: ERC721MetadataDocument = await ERC721Service.findMetadataById(req.params.metadataId);
    if (!metadata) throw new NotFoundError('Could not find this NFT metadata in the database');

    const tokens = await ERC721Service.findTokensByMetadata(metadata);
    const token = await ERC721Service.mint(req.assetPool, erc721, metadata, req.body.recipient);

    tokens.push(token);

    res.status(201).json({ ...metadata.toJSON(), tokens });
};

export default { controller, validation };
