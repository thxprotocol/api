import { Request, Response, NextFunction } from 'express';
import SpotifyDataProxy from '../../../proxies/SpotifyDataProxy';
import { HttpError } from '../../../models/Error';

export const getSpotify = async (req: Request, res: Response, next: NextFunction) => {
    async function getSpotifyData() {
        const { isAuthorized, error, ...rest } = await SpotifyDataProxy.getSpotify(req.user.sub);
        if (error) throw new Error(error.message);
        return { isAuthorized, ...rest };
    }

    try {
        const { isAuthorized, users, ...rest } = await getSpotifyData();

        if (!isAuthorized) return res.json({ isAuthorized });

        res.send({
            users,
            isAuthorized,
            ...rest,
        });
    } catch (error) {
        next(new HttpError(502, error.message, error));
    }
};
