import { Request, Response } from 'express';
import { body } from 'express-validator';
import ERC721Service from '@/services/ERC721Service';

const validation = [
    body('name').exists().isString(),
    body('symbol').exists().isString(),
    body('description').exists().isString(),
    body('chainId').exists().isNumeric(),
    body('schema').exists().isArray(),
];

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['ERC721']

    const erc721 = await ERC721Service.create({
        sub: req.auth.sub,
        chainId: req.body.chainId,
        name: req.body.name,
        symbol: req.body.symbol,
        description: req.body.description,
        properties: req.body.schema,
    });

    res.status(201).json(erc721.toJSON());
};

export default { controller, validation };
