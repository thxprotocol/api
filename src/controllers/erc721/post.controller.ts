import { Request, Response } from 'express';
import { body } from 'express-validator';
import ERC721Service from '@/services/ERC721Service';
import { TERC721 } from '@/types/TERC721';

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
        schema: req.body.schema,
    });
    const { id, network, name, symbol, description, address, schema } = erc721;
    const result: TERC721 = {
        id,
        network,
        name,
        symbol,
        description,
        address,
        schema,
    };

    res.status(201).json(result);
};
