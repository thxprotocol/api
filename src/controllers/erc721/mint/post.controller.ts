import ERC721Service from '@/services/ERC721Service';
import { Request, Response } from 'express';
import { body, param } from 'express-validator';
import { TERC721 } from '@/types/TERC721';
import { NotFoundError } from '@/util/errors';

export const mintERC721TokenValidation = [
    param('id').isString().isLength({ min: 23, max: 25 }),
    body('recipient').isEthereumAddress(),
];

export const MintERC721TokenController = async (req: Request, res: Response) => {
    const erc721 = await ERC721Service.findById(req.params.id);
    if (!erc721) throw new NotFoundError();

    await ERC721Service.mint(erc721, req.body.recipient);

    const { id, network, name, symbol, description, address } = await ERC721Service.deploy(erc721);
    const result: TERC721 = {
        id,
        network,
        name,
        symbol,
        description,
        address,
    };

    res.status(201).json(result);
};
