import qrcode from 'qrcode';
import { HttpError } from '../../models/Error';
import { NextFunction, Request, Response } from 'express';

export const getPollFinalize = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const base64 = await qrcode.toDataURL(
            JSON.stringify({
                assetPoolAddress: req.header('AssetPool'),
                contractAddress: req.params.address,
                contract: 'BasePoll',
                method: 'finalize',
            }),
        );
        res.send({ base64 });
    } catch (err) {
        next(new HttpError(500, 'QR data encoding failed.', err));
    }
};
