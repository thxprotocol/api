import SpotifyDataProxy from '../../proxies/SpotifyDataProxy';
import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../../models/Error';

export const getSpotify = async (req: Request, res: Response, next: NextFunction) => {
    async function getSpotifyData() {
        const { isAuthorized, users, error } = await SpotifyDataProxy.getSpotify(req.user.sub);
        if (error) throw new Error(error.message);
        return { isAuthorized, users };
    }

    try {
        const { isAuthorized, users } = await getSpotifyData();

        if (!isAuthorized) return res.json({ isAuthorized });

        res.send({
            isAuthorized,
            users,
        });
    } catch (error) {
        next(new HttpError(502, error.message, error));
    }
};
