import { Request, Response } from 'express';
import MemberService from '@/services/MemberService';

const getPoolMembers = async (req: Request, res: Response) => {
    const response = await MemberService.findByQuery(
        { poolAddress: req.params.id },
        Number(req.query.page),
        Number(req.query.limit),
    );

    res.send(response);
};

export default {
    controller: getPoolMembers,
};
