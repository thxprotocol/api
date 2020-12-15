import { Response, Request, NextFunction } from 'express';
import { VERSION } from '../../util/secrets';
import { HttpError } from '../../models/Error';
import { ASSET_POOL, gasStation, parseResultLog } from '../../util/network';

export const postCallWithdrawalWithdraw = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tx = await (
            await gasStation.call(req.body.call, req.body.contractAddress, req.body.nonce, req.body.sig)
        ).wait();

        try {
            const { error, logs } = await parseResultLog(ASSET_POOL.abi, tx.logs);

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
