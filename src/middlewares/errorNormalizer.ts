import { NextFunction, Request, Response } from 'express';
import { HttpError } from '@/models/Error';
import { THXHttpError, UnauthorizedError } from '@/util/errors';
import { UnauthorizedError as JWTUnauthorizedError } from 'express-jwt';

export const errorNormalizer = (error: Error, _req: Request, _res: Response, next: NextFunction) => {
    if (error instanceof HttpError) {
        return next(new THXHttpError(error.message, error.status));
    } else if (error instanceof JWTUnauthorizedError) {
        return next(new UnauthorizedError(error.message));
    }

    next(error);
};
