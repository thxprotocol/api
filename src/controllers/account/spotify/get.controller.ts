import { Request, Response } from 'express';
import SpotifyDataProxy from '@/proxies/SpotifyDataProxy';

export const getSpotify = async (req: Request, res: Response) => {
    async function getSpotifyData() {
        const { isAuthorized, error, ...rest } = await SpotifyDataProxy.getSpotify(req.user.sub);
        if (error) throw new Error(error.message);
        return { isAuthorized, ...rest };
    }

    const { isAuthorized, users, ...rest } = await getSpotifyData();

    if (!isAuthorized) return res.json({ isAuthorized });

    res.send({
        users,
        isAuthorized,
        ...rest,
    });
};
