import { THXHttpError } from '@/util/errors';
import { logger } from '@/util/logger';
import { NextFunction, Request, Response } from 'express';

export const errorLogger = (error: Error, req: Request, res: Response, next: NextFunction) => {
    if (!(error instanceof THXHttpError)) {
        logger.error('Error caught:', error);
    }

    console.log(`%c ${error}`, 'color: #ff0000');

    next(error);
};
