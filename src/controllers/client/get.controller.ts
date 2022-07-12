import { Request, Response } from 'express';

import { BadRequestError } from '@/util/errors';
import ClientProxy from '@/proxies/ClientProxy';

const getClientByPool = async (req: Request, res: Response) => {
    const poolId = req.headers['X-PoolId'] as string;
    if (!poolId) throw new BadRequestError('Cannot found Pool ID in this request');
    const clients = await ClientProxy.findByPool(poolId);

    const data = clients.map((client) => ({
        id: client._id,
        poolId: client.poolId,
        clientSecret: client.clientSecret,
        requestUris: client.requestUris,
    }));

    res.status(200).send(data);
};

export default {
    controller: getClientByPool,
};
