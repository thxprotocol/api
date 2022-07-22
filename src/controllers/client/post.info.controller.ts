import { Request, Response } from 'express';

import ClientProxy from '@/proxies/ClientProxy';

const getClientInfo = async (req: Request, res: Response) => {
    const clientId = req.body['clientId'] as string;
    const registrationAccessToken = req.body['registrationAccessToken'] as string;
    const info = await ClientProxy.info(clientId, registrationAccessToken);

    res.status(200).send(info);
};

export default {
    controller: getClientInfo,
};
