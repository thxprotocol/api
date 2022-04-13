import { Request, Response } from 'express';
import ERC721Service from '@/services/ERC721Service';
import { ERC721Document } from '@/models/ERC721';

export const ListERC721Controller = async (req: Request, res: Response) => {
    const result: ERC721Document[] = await ERC721Service.findBySub(req.user.sub);
    res.json(result.map((erc721: ERC721Document) => erc721._id));
};
