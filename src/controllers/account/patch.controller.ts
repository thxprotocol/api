import { Request, Response } from 'express';
import { VERSION } from '@/util/secrets';
import AccountProxy from '@/proxies/AccountProxy';

export const patchAccount = async (req: Request, res: Response) => {
    await AccountProxy.update(req.user.sub, {
        address: req.body.address,
        googleAccess: req.body.googleAccess,
        twitterAccess: req.body.twitterAccess,
        spotifyAccess: req.body.spotifyAccess,
    });

    res.redirect(303, `/${VERSION}/account`);
};
