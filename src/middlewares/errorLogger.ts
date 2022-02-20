import { logger } from '@/util/logger';
import { NextFunction, Request, Response } from 'express';

export const errorLogger = (error: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error(error);
    next(error);
};
