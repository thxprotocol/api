import newrelic from 'newrelic';
import { Request, Response } from 'express';
import { AssetPool } from '@/models/AssetPool';
import AssetPoolService from '@/services/AssetPoolService';
import ClientService from '@/services/ClientService';
import { body } from 'express-validator';
import { AccountPlanType } from '@/types/enums/AccountPlanType';
import { NetworkProvider } from '@/types/enums';
import AccountProxy from '@/proxies/AccountProxy';
import ERC721Service from '@/services/ERC721Service';
import MembershipService from '@/services/MembershipService';

const validation = [
    body('token').isEthereumAddress(),
    body('network').exists().isNumeric(),
    body('variant').optional().isString(),
];

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['Pools']
    const account = await AccountProxy.getById(req.user.sub);

    if (account.plan === AccountPlanType.Free && req.body.network === NetworkProvider.Main) {
        await AccountProxy.update(account.id, { plan: AccountPlanType.Basic });
    }

    const assetPool = await AssetPoolService.deploy(req.user.sub, req.body.network, req.body.variant);

    if (assetPool.variant === 'defaultPool') {
        await AssetPoolService.setERC20(assetPool, req.body.token);
        await MembershipService.addERC20Membership(req.user.sub, assetPool);
    }

    if (assetPool.variant === 'nftPool') {
        const erc721 = await ERC721Service.findByQuery({ address: req.body.token, network: assetPool.network });
        await AssetPoolService.setERC721(assetPool, erc721);
        await MembershipService.addERC721Membership(req.user.sub, assetPool);
    }

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

export default { controller, validation };
