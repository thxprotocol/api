import { Request, Response } from 'express';

import { BadRequestError } from '@/util/errors';
import ClientProxy from '@/proxies/ClientProxy';

const getClientByPool = async (req: Request, res: Response) => {
    const poolId = req.headers['x-poolid'] as string;
    if (!poolId) throw new BadRequestError('Cannot found Pool ID in this request');

    const response = await ClientProxy.findByQuery({ poolId }, Number(req.query.page), Number(req.query.limit));

    response.results = response.results.map((client) => ({
        clientId: client.clientId,
        poolId: client.poolId,
        registrationAccessToken: client.registrationAccessToken,
        sub: client.sub,
    }));

    res.status(200).send(response);
};

export default {
    controller: getClientByPool,
};
