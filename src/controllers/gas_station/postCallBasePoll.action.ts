import { Response, NextFunction } from 'express';
import { VERSION } from '../../util/secrets';
import { HttpError } from '../../models/Error';
import { ISolutionRequest } from '../../util/network';

export const postCallBasePoll = async (req: ISolutionRequest, res: Response, next: NextFunction) => {
    try {
        await (await req.solution.call(req.body.call, req.body.contractAddress, req.body.nonce, req.body.sig)).wait();

        res.redirect(`/${VERSION}/${req.body.redirect}`);
    } catch (err) {
        next(new HttpError(502, 'BasePoll Call failed.', err));
    }
};

export const postCallBasePollFinalize = async (req: ISolutionRequest, res: Response, next: NextFunction) => {
    try {
        await (await req.solution.call(req.body.call, req.body.contractAddress, req.body.nonce, req.body.sig)).wait();

        // AssetPool.onRewardPollFinish should cast an event containing the reward id.
        res.json({ message: 'OK' });
    } catch (err) {
        next(new HttpError(502, 'Gas Station call failed.', err));
    }
};

// export const postCallBasePollRevokeVote = async (req: Request, res: Response, next: NextFunction) => {
//     try {
//         const tx = await gasStation.call(req.body.call, req.body.contractAddress, req.body.nonce, req.body.sig);

//         await tx.wait();

//         res.redirect(`/${VERSION}/polls/${req.body.contractAddress}`);
//     } catch (err) {
//         next(new HttpError(502, 'BasePoll RevokeVote failed.', err));
//     }
// };

// export const postCallBasePollWithdraw = async (req: Request, res: Response, next: NextFunction) => {
//     try {
//         const tx = await gasStation.call(req.body.call, req.body.contractAddress, req.body.nonce, req.body.sig);

//         await tx.wait();

//         // AssetPool.onRewardPollFinish should cast an event containing the reward id.
//         res.json({ message: 'OK' });
//     } catch (err) {
//         next(new HttpError(502, 'Gas Station call failed.', err));
//     }
// };
