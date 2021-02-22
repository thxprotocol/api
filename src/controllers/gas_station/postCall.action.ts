import { Response, NextFunction } from 'express';
import { HttpError, HttpRequest } from '../../models/Error';

export const postCall = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        const tx = await (await req.solution.call(req.body.call, req.body.nonce, req.body.sig)).wait();

        console.log(tx);

        res.json({ tx: tx.transactionHash });
    } catch (err) {
        return next(new HttpError(502, 'gas_station/call WRITE failed.', err));
    }
};
