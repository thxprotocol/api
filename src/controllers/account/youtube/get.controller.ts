import YoutubeDataProxy from '@/proxies/YoutubeDataProxy';
import { Request, Response } from 'express';

export const getYoutube = async (req: Request, res: Response) => {
    const { isAuthorized, channels, videos } = await YoutubeDataProxy.getYoutube(req.user.sub);

    if (!isAuthorized) {
        res.json({ isAuthorized });
    } else {
        res.send({
            isAuthorized,
            channels,
            videos,
        });
    }
};
