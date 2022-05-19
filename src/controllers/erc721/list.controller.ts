import { Request, Response } from 'express';
import ERC721Service from '@/services/ERC721Service';
import { ERC721Document } from '@/models/ERC721';

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['ERC721']
    const result: ERC721Document[] = await ERC721Service.findBySub(req.user.sub);
    res.json(result.map((erc721: ERC721Document) => erc721._id));
};

export default { controller };
