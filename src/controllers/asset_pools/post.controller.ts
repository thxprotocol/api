import newrelic from 'newrelic';
import { Request, Response } from 'express';
import { AssetPool } from '@/models/AssetPool';
import AssetPoolService from '@/services/AssetPoolService';
import ClientService from '@/services/ClientService';
import { body } from 'express-validator';
import { AccountPlanType } from '@/types/enums/AccountPlanType';
import { NetworkProvider } from '@/types/enums';
import AccountProxy from '@/proxies/AccountProxy';

export const createAssetPoolValidation = [body('token').isEthereumAddress(), body('network').exists().isNumeric()];

export const postAssetPool = async (req: Request, res: Response) => {
    const account = await AccountProxy.getById(req.user.sub);

    if (account.plan === AccountPlanType.Free && req.body.network === NetworkProvider.Main) {
        await AccountProxy.update(account.id, { plan: AccountPlanType.Basic });
    }

    const assetPool = await AssetPoolService.deploy(req.user.sub, req.body.network);

    await AssetPoolService.addPoolToken(assetPool, req.body.token);

    const client = await ClientService.create(req.user.sub, {
        application_type: 'web',
        grant_types: ['client_credentials'],
        request_uris: [],
        redirect_uris: [],
        post_logout_redirect_uris: [],
        response_types: [],
        scope: 'openid admin',
    });

    assetPool.clientId = client.clientId;
    await assetPool.save();

    AssetPool.countDocuments({}, (_err: any, count: number) => newrelic.recordMetric('/AssetPool/Count', count));

    res.status(201).json({ address: assetPool.address });
};
