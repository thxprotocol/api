import ERC721Service from '@/services/ERC721Service';
import { Request, Response } from 'express';
import { body, param } from 'express-validator';
import { NotFoundError } from '@/util/errors';
import { ERC721TokenDocument } from '@/models/ERC721Token';

const validation = [
    param('id').isMongoId(),
    body('title').isString().isLength({ min: 0, max: 100 }),
    body('description').isString().isLength({ min: 0, max: 400 }),
    // TODO Validate the metadata with the schema configured in the collection here
    body('attributes').exists(),
    body('beneficiary').optional().isEthereumAddress(),
];

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['ERC721']
    const erc721 = await ERC721Service.findById(req.params.id);
    if (!erc721) throw new NotFoundError('Could not find this NFT in the database');

    const metadata = await ERC721Service.createMetadata(
        erc721,
        req.body.title,
        req.body.description,
        req.body.attributes,
    );

    if (req.body.recipient) {
        const token = await ERC721Service.mint(req.assetPool, erc721, metadata, req.body.recipient);
        return res.status(201).json({ ...token.toJSON(), metadata: metadata.toJSON() });
    }

    res.status(201).json({ metadata: metadata.toJSON() });
};

export default { controller, validation };
