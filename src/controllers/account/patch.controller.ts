import { Request, Response } from 'express';
import { VERSION } from '@/config/secrets';
import AccountProxy from '@/proxies/AccountProxy';
import { recoverSigner } from '@/util/network';

export default {
    controller: async (req: Request, res: Response) => {
        // #swagger.tags = ['Account']
        let address;
        if (req.body.authRequestMessage && req.body.authRequestSignature) {
            address = recoverSigner(req.body.authRequestMessage, req.body.authRequestSignature);
        }

        await AccountProxy.update(req.auth.sub, { ...req.body, address });

        res.redirect(303, `/${VERSION}/account`);
    },
};
