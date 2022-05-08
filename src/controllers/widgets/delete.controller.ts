import { Request, Response } from 'express';
import WidgetService from '@/services/WidgetService';
import ClientService from '@/services/ClientService';
import { BadRequestError } from '@/util/errors';

export const deleteWidget = async (req: Request, res: Response) => {
    // #swagger.tags = ['Widgets']
    const client = await ClientService.get(req.params.clientId);

    if (!client) {
        throw new BadRequestError('Unable to find client');
    }

    await WidgetService.remove(req.params.clientId);
    await ClientService.remove(req.params.clientId);

    res.status(204).end();
};
