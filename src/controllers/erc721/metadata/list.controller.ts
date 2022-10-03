import { Request, Response } from 'express';
import ERC721Service from '@/services/ERC721Service';
import { param, query } from 'express-validator';
import { NotFoundError } from '@/util/errors';

export const validation = [
    param('id').isMongoId(),
    query('limit').optional().isInt({ gt: 0 }),
    query('page').optional().isInt({ gt: 0 }),
    query('q').optional().isString(),
];

export const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['ERC721']
    const erc721 = await ERC721Service.findById(req.params.id);
    if (!erc721) throw new NotFoundError('Could not find this NFT in the database');

    const result = await ERC721Service.findMetadataByNFT(
        erc721._id,
        req.query.page ? Number(req.query.page) : null,
        req.query.limit ? Number(req.query.limit) : null,
        req.query.q ? String(req.query.q) : null,
    );
    res.json(result);
};

export default { controller, validation };
