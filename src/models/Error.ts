import { Contract } from 'web3-eth-contract';
import { logger } from '../util/logger';
import { Request } from 'express';
import { IAssetPool } from './AssetPool';

export class HttpError extends Error {
    timestamp: number;
    status: number;

    constructor(status: number, message: string, error: Error = null) {
        super(message);

        if (error) {
            logger.error(error.toString());
        }

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, HttpError);
        }

        this.status = status;
        this.timestamp = Date.now();
    }
}

export interface HttpRequest extends Request {
    origin?: string;
    user?: any;
    assetPool?: IAssetPool;
}
