import YoutubeDataProxy from '../../proxies/YoutubeDataProxy';
import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../../models/Error';

export const getYoutube = async (req: Request, res: Response, next: NextFunction) => {
    async function getYouTube() {
        const { isAuthorized, channels, videos, error } = await YoutubeDataProxy.getYoutube(req.user.sub);
        if (error) throw new Error(error.message);
        return { isAuthorized, channels, videos };
    }

    try {
        const { isAuthorized, channels, videos } = await getYouTube();

        if (!isAuthorized) return res.json({ isAuthorized });

        res.send({
            isAuthorized,
            channels,
            videos,
        });
    } catch (error) {
        next(new HttpError(502, error.message, error));
    }
};
