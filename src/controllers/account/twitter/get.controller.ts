import TwitterDataProxy from '@/proxies/TwitterDataProxy';
import { Request, Response } from 'express';

export const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['Account']
    const { isAuthorized, tweets, users } = await TwitterDataProxy.getTwitter(req.user.sub);

    if (!isAuthorized) {
        res.json({ isAuthorized });
    } else {
        res.send({
            isAuthorized,
            tweets,
            users,
        });
    }
};
export default { controller };
