import { Request } from 'express';
import AccountProxy from '@/proxies/AccountProxy';

export const patchAccount = async (req: Request) => {
    await AccountProxy.update(req.user.sub, {
        address: req.body.address,
        googleAccess: req.body.googleAccess,
        twitterAccess: req.body.twitterAccess,
        spotifyAccess: req.body.spotifyAccess,
    });
};
