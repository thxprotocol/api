import { Request, Response } from 'express';
import { body, param } from 'express-validator';
import ERC721Service from '@/services/ERC721Service';
import { NotFoundError } from '@/util/errors';

export const validation = [param('id').exists(), body('archived').exists().isBoolean()];

export const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['ERC721']
    const erc721 = await ERC721Service.findById(req.params.id);
    if (!erc721) throw new NotFoundError('Could not find the token for this id');
    const result = await ERC721Service.update(erc721, req.body);
    return res.json(result);
};
export default { controller, validation };
