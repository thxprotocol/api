import TwitterDataProxy from '../../proxies/TwitterDataProxy';
import { Response, NextFunction } from 'express';
import { HttpError, HttpRequest } from '../../models/Error';

export const getTwitter = async (req: HttpRequest, res: Response, next: NextFunction) => {
    async function getTwitterData() {
        const { isAuthorized, tweets, users, error } = await TwitterDataProxy.getTwitter(req.user.sub);
        if (error) throw new Error(error.message);
        return { isAuthorized, tweets, users };
    }

    try {
        const { isAuthorized, tweets, users } = await getTwitterData();

        if (!isAuthorized) return res.json({ isAuthorized });

        res.send({
            isAuthorized,
            tweets,
            users,
        });
    } catch (error) {
        next(new HttpError(502, error.message, error));
    }
};