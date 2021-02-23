import { Response, NextFunction } from 'express';
// import { parseResultLog } from '../../util/events';
import { HttpError, HttpRequest } from '../../models/Error';
// import GasStationFacetArtifact from '../../artifacts/contracts/contracts/07-GasStation/GasStation.sol/GasStationFacet.json';

export const postCall = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        const tx = await (await req.solution.call(req.body.call, req.body.nonce, req.body.sig)).wait();

        res.json({ tx: tx.transactionHash });
    } catch (err) {
        return next(new HttpError(502, 'gas_station/call WRITE failed.', err));
    }
};
