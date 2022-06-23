import { Request, Response } from 'express';
import { query } from 'express-validator';

import MemberService from '@/services/MemberService';

export const validation = [query('limit').isNumeric(), query('page').isNumeric()];

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['Pools']
    const response = await MemberService.findByQuery(
        { poolAddress: req.header('AssetPool') },
        Number(req.query.page),
        Number(req.query.limit),
    );

    res.send(response);
};

export default { controller, validation };
