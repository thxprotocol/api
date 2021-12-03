import { Response, NextFunction } from 'express';
import { HttpError, HttpRequest } from '../../models/Error';
import AccountService from '../../services/AccountService';
import YouTubeDataService from '../../services/YouTubeDataService';

export const getYoutube = async (req: HttpRequest, res: Response, next: NextFunction) => {
    async function getAccount() {
        const { account, error } = await AccountService.getById(req.user.sub);
        if (error) throw new Error(error.message);
        return account;
    }

    async function getYouTubeChannels(accessToken: string) {
        const { channels, error } = await YouTubeDataService.getChannelList(accessToken);
        if (error) throw new Error(error.message);
        return channels;
    }

    async function getYouTubeVideos(accessToken: string) {
        const { videos, error } = await YouTubeDataService.getVideoList(accessToken);
        if (error) throw new Error(error.message);
        return videos;
    }

    try {
        const account = await getAccount();
        const channels = await getYouTubeChannels(account.googleAccessToken);
        const videos = await getYouTubeVideos(account.googleAccessToken);

        res.send({
            channels,
            videos,
        });
    } catch (error) {
        next(new HttpError(502, error.message, error));
    }
};
