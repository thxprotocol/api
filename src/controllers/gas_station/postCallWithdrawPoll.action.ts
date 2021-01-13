import { Response, NextFunction } from 'express';
import { VERSION } from '../../util/secrets';
import { HttpError, HttpRequest } from '../../models/Error';
import ISolutionArtifact from '../../../src/artifacts/contracts/contracts/interfaces/ISolution.sol/ISolution.json';
import { parseResultLog } from '../../util/events';

export const postCallWithdrawalWithdraw = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        const tx = await (
            await req.solution.call(req.body.call, req.body.contractAddress, req.body.nonce, req.body.sig)
        ).wait();

        try {
            const { error, logs } = await parseResultLog(ISolutionArtifact.abi, tx.logs);

            if (error) {
                throw error;
            }

            const event = logs.filter((e: any) => e && e.name === 'Withdrawn')[0];

            res.redirect(`/${VERSION}/members/${event.args.member}`);
        } catch (error) {
            next(new HttpError(500, 'Parse logs failed.', error));
        }
    } catch (err) {
        next(new HttpError(502, 'Gas Station call failed.', err));
    }
};
