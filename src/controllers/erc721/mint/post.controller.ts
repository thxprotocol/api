import ERC721Service from '@/services/ERC721Service';
import { Request, Response } from 'express';
import { body, param } from 'express-validator';
import { NotFoundError } from '@/util/errors';

export const mintERC721TokenValidation = [
    param('id').isMongoId(),
    body('beneficiary').isEthereumAddress(),
    body('metadata').exists(),
];

export const MintERC721TokenController = async (req: Request, res: Response) => {
    const erc721 = await ERC721Service.findById(req.params.id);
    if (!erc721) throw new NotFoundError('Could not find this NFT in the database');

    // TODO Validate the metadata with the schema configured in the collection here
    const entry = await ERC721Service.mint(req.assetPool, erc721, req.body.beneficiary, req.body.metadata);
    const metadata = await ERC721Service.parseMetadata(entry);

    res.status(201).json({
        _id: String(entry._id),
        tokenId: entry.tokenId,
        ...metadata,
        createdAt: entry.createdAt,
    });
};
