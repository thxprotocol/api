import newrelic from 'newrelic';
import { Request, Response } from 'express';
import { AssetPool, AssetPoolDocument } from '@/models/AssetPool';
import AssetPoolService from '@/services/AssetPoolService';
import ClientService from '@/services/ClientService';
import { body } from 'express-validator';
import { AccountPlanType } from '@/types/enums/AccountPlanType';
import { ERC20Type, NetworkProvider } from '@/types/enums';
import AccountProxy from '@/proxies/AccountProxy';
import ERC721Service from '@/services/ERC721Service';
import MembershipService from '@/services/MembershipService';
import ERC20Service from '@/services/ERC20Service';
import { ITX_ACTIVE } from '@/config/secrets';

const validation = [
    body('token').isEthereumAddress(),
    body('network').exists().isNumeric(),
    body('variant').optional().isString(),
];

const initialize = async (pool: AssetPoolDocument, tokenAddress: string) => {
    if (pool.variant === 'defaultPool') {
        const erc20 = await ERC20Service.findBy({ network: pool.network, address: tokenAddress });
        if (erc20 && erc20.type === ERC20Type.Unlimited) {
            await ERC20Service.addMinter(erc20, pool.address);
        }
        await MembershipService.addERC20Membership(pool.sub, pool);
    }

    if (pool.variant === 'nftPool') {
        const erc721 = await ERC721Service.findByQuery({ address: tokenAddress, network: pool.network });
        await ERC721Service.addMinter(erc721, pool.address);
        await MembershipService.addERC721Membership(pool.sub, pool);
    }
};

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['Pools']
    const account = await AccountProxy.getById(req.user.sub);

    if (account.plan === AccountPlanType.Free && req.body.network === NetworkProvider.Main) {
        await AccountProxy.update(account.id, { plan: AccountPlanType.Basic });
    }

    const pool = await AssetPoolService.deploy(req.user.sub, req.body.network, req.body.variant, req.body.token);

    // When ITX is initalization is not handled by the job processor but could be executed right away
    if (!ITX_ACTIVE) await initialize(pool, req.body.token);

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

    AssetPool.countDocuments({}, (_err: any, count: number) => newrelic.recordMetric('/AssetPool/Count', count));

    res.status(201).json(pool);
};

export default { controller, validation, initialize };
