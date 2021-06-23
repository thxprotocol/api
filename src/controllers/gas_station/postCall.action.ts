import { Response, NextFunction } from 'express';
import { sendTransaction } from '../../util/network';
import { HttpError, HttpRequest } from '../../models/Error';
import { hex2a } from '../../util/events';

export const postCall = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        const tx = await sendTransaction(
            req.solution.methods.call(req.body.call, req.body.nonce, req.body.sig),
            req.assetPool.network,
        );
        const event = tx.events.Result;

        if (event) {
            if (!event.returnValues.success) {
                const error = hex2a(event.returnValues.data.substr(10));

                return res.status(500).json({
                    error,
                });
            }
            res.status(200).end();
        }
    } catch (err) {
        return next(new HttpError(502, 'gas_station/call failed.', err));
    }
};
