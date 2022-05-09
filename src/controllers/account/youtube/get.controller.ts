import YoutubeDataProxy from '@/proxies/YoutubeDataProxy';
import { Request, Response } from 'express';

export const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['Account']
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

export default { controller };
