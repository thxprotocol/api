import { Request, Response } from 'express';
import { body } from 'express-validator';
import { isAddress } from 'web3-utils';
import { checkAndUpgradeToBasicPlan } from '@/util/plans';
import AssetPoolService from '@/services/AssetPoolService';
import ClientService from '@/services/ClientService';
import AccountProxy from '@/proxies/AccountProxy';

const validation = [
    body('tokens').custom((tokens: string[]) => {
        for (const tokenAddress of tokens) {
            if (!isAddress(tokenAddress)) return false;
        }
        return true;
    }),
    body('chainId').exists().isNumeric(),
    body('variant').optional().isString(),
];

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['Pools']
    const account = await AccountProxy.getById(req.auth.sub);

    await checkAndUpgradeToBasicPlan(account, req.body.chainId);

    const pool = await AssetPoolService.deploy(req.auth.sub, req.body.chainId, req.body.variant, req.body.tokens);
    const client = await ClientService.create(req.auth.sub, {
        application_type: 'web',
        grant_types: ['client_credentials'],
        request_uris: [],
        redirect_uris: [],
        post_logout_redirect_uris: [],
        response_types: [],
        scope: 'openid account:read account:write members:read members:write withdrawals:write',
    });

    pool.clientId = client.clientId;
    await pool.save();

    res.status(201).json(pool);
};

export default { controller, validation };
