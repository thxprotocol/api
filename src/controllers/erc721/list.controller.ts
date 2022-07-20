import { Request, Response } from 'express';
import ERC721Service from '@/services/ERC721Service';
import { ERC721Document } from '@/models/ERC721';
import { query } from 'express-validator';

export const validation = [query('archived').optional().isBoolean()];

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['ERC721']
    const result: ERC721Document[] = await ERC721Service.findBySub(req.auth.sub);
    const archived = req.query.archived == 'true' ? true : false;
    res.json(result.filter((x) => x.archived === archived).map((erc721: ERC721Document) => erc721._id));
};

export default { controller, validation };
