import { Response, Request, NextFunction } from 'express';
import { VERSION } from '../../util/secrets';
import { HttpError } from '../../models/Error';
import { solutionContract } from '../../util/network';
import ISolutionArtifact from '../../../src/artifacts/contracts/contracts/interfaces/ISolution.sol/ISolution.json';
import { parseResultLog } from '../../util/events';

export const postCallAssetPool = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const solution = solutionContract(req.header('AssetPool'));

        await (await solution.call(req.body.call, req.body.contractAddress, req.body.nonce, req.body.sig)).wait();

        res.redirect(`/${VERSION}/${req.body.redirect}`);
    } catch (err) {
        next(new HttpError(502, 'BasePoll Call failed.', err));
    }
};

export const postAssetPoolClaimReward = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const solution = solutionContract(req.header('AssetPool'));
        const tx = await (
            await solution.call(req.body.call, req.body.contractAddress, req.body.nonce, req.body.sig)
        ).wait();

        try {
            const { error, logs } = await parseResultLog(ISolutionArtifact.abi, tx.logs);

            if (error) {
                throw error;
            }

            const event = logs.filter((e: { name: string }) => e.name === 'WithdrawPollCreated')[0];
            const pollAddress = event.args.poll;

            res.redirect(`/${VERSION}/withdrawals/${pollAddress}`);
        } catch (error) {
            next(new HttpError(500, 'Parse logs failed.', error));
            return;
        }
    } catch (err) {
        next(new HttpError(502, 'AssetPool ClaimReward failed.', err));
    }
};

export const postCallAssetPoolProposeWithdraw = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const solution = solutionContract(req.header('AssetPool'));
        const tx = await (
            await solution.call(req.body.call, req.body.contractAddress, req.body.nonce, req.body.sig)
        ).wait();

        try {
            const { error, logs } = await parseResultLog(ISolutionArtifact.abi, tx.logs);

            if (error) {
                throw error;
            }

            const event = logs.filter((e: { name: string }) => e.name === 'WithdrawPollCreated')[0];
            const pollAddress = event.args.poll;

            res.redirect(`/${VERSION}/withdrawals/${pollAddress}`);
        } catch (err) {
            next(new HttpError(500, 'Parse logs failed.', err));
            return;
        }
    } catch (err) {
        next(new HttpError(502, 'Gas Station call failed.', err));
    }
};
