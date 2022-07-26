import { Request, Response } from 'express';
import ClientProxy from '@/proxies/ClientProxy';

export default {
    controller: async (req: Request, res: Response) => {
        const client = await ClientProxy.get(req.params.id);
        res.status(200).json(client);
    },
};
