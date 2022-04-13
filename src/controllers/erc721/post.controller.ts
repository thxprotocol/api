import { Request, Response } from 'express';
import { body } from 'express-validator';
import ERC721Service from '@/services/ERC721Service';

export const createERC721Validation = [
    body('name').exists().isString(),
    body('symbol').exists().isString(),
    body('description').exists().isString(),
    body('network').exists().isNumeric(),
    body('schema').exists().isArray(),
];

export const CreateERC721Controller = async (req: Request, res: Response) => {
    const erc721 = await ERC721Service.create({
        network: req.body.network,
        name: req.body.name,
        symbol: req.body.symbol,
        description: req.body.description,
        properties: req.body.schema,
    });

    res.status(201).json(erc721.toJSON());
};
