import { Request, Response } from 'express';
import { BadRequestError } from '@/util/errors';
import ClientProxy from '@/proxies/ClientProxy';

export default {
    controller: async (req: Request, res: Response) => {
        const poolId = req.header('X-PoolId');
        if (!poolId) throw new BadRequestError('X-PoolId header is not set');

        const clients = await ClientProxy.findByQuery({ poolId }, Number(req.query.page), Number(req.query.limit));
        res.status(200).json(clients);
    },
};
