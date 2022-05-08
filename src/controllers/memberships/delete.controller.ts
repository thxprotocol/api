import { Request, Response } from 'express';
import MembershipService from '@/services/MembershipService';

export const deleteMembership = async (req: Request, res: Response) => {
    // #swagger.tags = ['Memberships']
    await MembershipService.remove(req.params.id);

    res.status(204).end();
};
