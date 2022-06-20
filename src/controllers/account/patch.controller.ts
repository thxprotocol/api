import { Request, Response } from 'express';
import { VERSION } from '@/config/secrets';
import AccountProxy from '@/proxies/AccountProxy';

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['Account']
    await AccountProxy.update(req.auth.sub, {
        address: req.body.address,
        googleAccess: req.body.googleAccess,
        twitterAccess: req.body.twitterAccess,
        spotifyAccess: req.body.spotifyAccess,
    });

    res.redirect(303, `/${VERSION}/account`);
};

export default { controller };
