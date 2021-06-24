import { Response, NextFunction } from 'express';
import { sendTransaction, SolutionArtifact } from '../../util/network';
import { HttpError, HttpRequest } from '../../models/Error';
import { hex2a, parseLogs, findEvent } from '../../util/events';

export const postCall = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        const tx = await sendTransaction(
            req.solution.options.address,
            req.solution.methods.call(req.body.call, req.body.nonce, req.body.sig),
            req.assetPool.network,
        );
        const events = parseLogs(SolutionArtifact.abi, tx.logs);
        const event = findEvent('Result', events);

        if (event) {
            if (!event.args.success) {
                const error = hex2a(event.args.data.substr(10));

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
