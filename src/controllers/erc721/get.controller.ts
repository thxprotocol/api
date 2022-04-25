import { param } from 'express-validator';
import { Request, Response } from 'express';
import ERC721Service from '@/services/ERC721Service';
import { NotFoundError } from '@/util/errors';

export const readERC721Validation = [param('id').isString().isLength({ min: 23, max: 25 })];

export const ReadERC721Controller = async (req: Request, res: Response) => {
    const erc721 = await ERC721Service.findById(req.params.id);
    if (!erc721) throw new NotFoundError();

    const totalSupply = await erc721.contract.methods.totalSupply().call();
    const owner = await erc721.contract.methods.owner().call();

    res.json({ ...erc721.toJSON(), totalSupply, owner });
};
