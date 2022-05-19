import { Request, Response } from 'express';
import { param } from 'express-validator';
import { BadRequestError } from '@/util/errors';
import WidgetService from '@/services/WidgetService';
import ClientService from '@/services/ClientService';

const validation = [param('clientId').exists()];
const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['Widgets']
    const client = await ClientService.get(req.params.clientId);

    if (!client) {
        throw new BadRequestError('Unable to find client');
    }

    await WidgetService.remove(req.params.clientId);
    await ClientService.remove(req.params.clientId);

    res.status(204).end();
};

export default { controller, validation };
