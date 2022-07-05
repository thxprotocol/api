import { Request, Response } from 'express';
import { NotFoundError } from '@/util/errors';
import { param } from 'express-validator';
import { Claim } from '@/models/Claim';

const validation = [param('id').isNumeric().exists()];

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['Claims']
    const claim = await Claim.findById(req.params.id);
    if (!claim) throw new NotFoundError('Coudl not find Claim');

    res.json(claim);
};

export default { controller, validation };
