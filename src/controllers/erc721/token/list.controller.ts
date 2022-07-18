import { Request, Response } from 'express';
import { ERC721TokenDocument } from '@/models/ERC721Token';
import ERC721Service from '@/services/ERC721Service';

export const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['ERC721']
    const tokens = await ERC721Service.findTokensBySub(req.auth.sub);
    return res.json(tokens.map((token: ERC721TokenDocument) => token._id));
};

export default { controller };
