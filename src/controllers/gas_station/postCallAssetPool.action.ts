import { Response, NextFunction } from 'express';
import { VERSION } from '../../util/secrets';
import { HttpError, HttpRequest } from '../../models/Error';
import IDefaultDiamondArtifact from '../../../src/artifacts/contracts/contracts/IDefaultDiamond.sol/IDefaultDiamond.json';

import { parseResultLog } from '../../util/events';

export const postCallAssetPool = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        await (await req.solution.call(req.body.call, req.body.nonce, req.body.sig)).wait();

        res.redirect(`/${VERSION}/${req.body.redirect}`);
    } catch (err) {
        next(new HttpError(502, 'BasePoll Call failed.', err));
    }
};

export const postAssetPoolClaimReward = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        const tx = await (await req.solution.call(req.body.call, req.body.nonce, req.body.sig)).wait();

        try {
            const { error, logs } = await parseResultLog(IDefaultDiamondArtifact.abi, tx.logs);

            if (error) {
                throw error;
            }

            const event = logs.filter((e: { name: string }) => e.name === 'WithdrawPollCreated')[0];
            const pollID = event.args.id;

            res.redirect(`/${VERSION}/withdrawals/${pollID}`);
        } catch (error) {
            next(new HttpError(500, 'Parse logs failed.', error));
            return;
        }
    } catch (err) {
        next(new HttpError(502, 'AssetPool ClaimReward failed.', err));
    }
};

export const postCallAssetPoolProposeWithdraw = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        const tx = await (await req.solution.call(req.body.call, req.body.nonce, req.body.sig)).wait();

        try {
            const { error, logs } = await parseResultLog(IDefaultDiamondArtifact.abi, tx.logs);

            if (error) {
                throw error;
            }

            const event = logs.filter((e: { name: string }) => e.name === 'WithdrawPollCreated')[0];
            const pollID = event.args.id;

            res.redirect(`/${VERSION}/withdrawals/${pollID}`);
        } catch (err) {
            next(new HttpError(500, 'Parse logs failed.', err));
            return;
        }
    } catch (err) {
        next(new HttpError(502, 'Gas Station call failed.', err));
    }
};
