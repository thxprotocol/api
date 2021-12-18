import YoutubeDataProxy from '../../proxies/YoutubeDataProxy';
import { Response, NextFunction } from 'express';
import { HttpError, HttpRequest } from '../../models/Error';

export const getYoutube = async (req: HttpRequest, res: Response, next: NextFunction) => {
    async function getYouTube() {
        const { channels, videos, error } = await YoutubeDataProxy.getYoutube(req.user.sub);
        if (error) throw new Error(error.message);
        return { channels, videos };
    }

    try {
        const { channels, videos } = await getYouTube();

        res.send({
            channels,
            videos,
        });
    } catch (error) {
        next(new HttpError(502, error.message, error));
    }
};
