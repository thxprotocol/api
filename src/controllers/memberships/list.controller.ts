import { Request, Response } from 'express';

import MembershipService from '@/services/MembershipService';

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['Memberships']
    const memberships = await MembershipService.get(req.user.sub);

    res.json(memberships);
};

export default { controller };
