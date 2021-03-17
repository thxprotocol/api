import { Response, NextFunction } from 'express';
import { parseResultLog } from '../../util/events';
import { HttpError, HttpRequest } from '../../models/Error';

export const postCall = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        const tx = await (await req.solution.call(req.body.call, req.body.nonce, req.body.sig)).wait();
        const { logs, error } = await parseResultLog(tx.logs);

        res.json({ tx: tx.transactionHash, error, logs });
    } catch (err) {
        return next(new HttpError(502, 'gas_station/call WRITE failed.', err));
    }
};
