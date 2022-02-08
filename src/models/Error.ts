import { logger } from '../util/logger';

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
