import newrelic from 'newrelic';
import { Request, Response } from 'express';
import { isAddress } from 'web3-utils';
import { AssetPool } from '@/models/AssetPool';
import AssetPoolService from '@/services/AssetPoolService';
import ClientService from '@/services/ClientService';
import MembershipService from '@/services/MembershipService';
import { body } from 'express-validator';

export const createAssetPoolValidation = [
    body('token')
        .exists()
        .custom((value) => {
            if (value.address) {
                return isAddress(value.address);
            }

            if (
                !value.address &&
                value.name &&
                value.symbol &&
                (!Number.isNaN(value.totalSupply) || value.totalSupply === 0)
            ) {
                return true;
            }

            return false;
        }),
    body('network').exists().isNumeric(),
];

export const postAssetPool = async (req: Request, res: Response) => {
    const assetPool = await AssetPoolService.deploy(req.user.sub, req.body.network);
    await AssetPoolService.init(assetPool);
    await AssetPoolService.addPoolToken(assetPool, req.body.token);
    await MembershipService.addMembership(req.user.sub, assetPool);

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
