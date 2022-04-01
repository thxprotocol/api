import { Request, Response } from 'express';
import ERC20Service from '@/services/ERC20Service';
import { body } from 'express-validator';

export const postERC20TokenValidation = [
    body('name').exists().isString(),
    body('symbol').exists().isString(),
    body('network').exists().isNumeric(),
    body('totalSupply').optional().isNumeric(),
];

export const postCreateToken = async (req: Request, res: Response) => {
    const token = await ERC20Service.create({
        name: req.body['name'],
        symbol: req.body['symbol'],
        network: req.body['network'],
        totalSupply: req.body['totalSupply'],
        sub: req.user.sub,
    });

    return res.send({ ...token.toJSON(), totalSupply: await token.getTotalSupply() });
};
