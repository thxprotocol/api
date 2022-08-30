import { Request, Response } from 'express';
import { body } from 'express-validator';
import ERC721Service from '@/services/ERC721Service';
import { ADDRESS_ZERO } from '@/config/secrets';

const validation = [
    body('name').exists().isString(),
    body('symbol').exists().isString(),
    body('description').exists().isString(),
    body('chainId').exists().isNumeric(),
    body('schema').exists().isArray(),
    body('royaltyAddress').optional().isString(),
    body('royaltyPercentage').optional().isInt({ max: 100 }),
];

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['ERC721']
    const erc721 = await ERC721Service.deploy({
        sub: req.auth.sub,
        chainId: req.body.chainId,
        name: req.body.name,
        symbol: req.body.symbol,
        description: req.body.description,
        properties: req.body.schema,
        archived: false,
        royaltyRecipient: req.body.royaltyAddress ? req.body.royaltyAddress : ADDRESS_ZERO,
        royaltyBps: req.body.royaltyPercentage ? Number(req.body.royaltyPercentage) * 1000 : 0,
    });

    res.status(201).json(erc721);
};

export default { controller, validation };
