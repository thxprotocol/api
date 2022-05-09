import { Request, Response } from 'express';
import MemberService from '@/services/MemberService';

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['Members']
    const members = await MemberService.getByPoolAddress(req.assetPool);

    res.json(members);
};

export default { controller };
