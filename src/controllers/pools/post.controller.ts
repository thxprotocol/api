import { Request, Response } from 'express';
import { body } from 'express-validator';
import { isAddress } from 'web3-utils';
import AssetPoolService from '@/services/AssetPoolService';
import ClientService from '@/services/ClientService';
import { AccountPlanType } from '@/types/enums/AccountPlanType';
import { NetworkProvider } from '@/types/enums';
import AccountProxy from '@/proxies/AccountProxy';

const validation = [
    body('tokens').custom((tokens: string[]) => {
        for (const tokenAddress of tokens) {
            if (!isAddress(tokenAddress)) return false;
        }
        return true;
    }),
    body('network').exists().isNumeric(),
    body('variant').optional().isString(),
];

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['Pools']
    const account = await AccountProxy.getById(req.user.sub);

    if (account.plan === AccountPlanType.Free && req.body.network === NetworkProvider.Main) {
        await AccountProxy.update(account.id, { plan: AccountPlanType.Basic });
    }

    const pool = await AssetPoolService.deploy(req.user.sub, req.body.network, req.body.variant, req.body.tokens);
    const client = await ClientService.create(req.user.sub, {
        application_type: 'web',
        grant_types: ['client_credentials'],
        request_uris: [],
        redirect_uris: [],
        post_logout_redirect_uris: [],
        response_types: [],
        scope: 'openid admin',
    });

    pool.clientId = client.clientId;
    await pool.save();

    res.status(201).json(pool);
};

export default { controller, validation };
