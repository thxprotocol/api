import { HttpError } from '@/models/Error';
import { THXHttpError } from '@/util/errors';
import { logger } from '@/util/logger';
import { NextFunction, Request, Response } from 'express';

export const errorLogger = (error: Error, req: Request, res: Response, next: NextFunction) => {
    if (error instanceof HttpError) {
        logger.error(error.rootError);
    } else if (!(error instanceof THXHttpError)) {
        logger.error(error);
    }

    next(error);
};
