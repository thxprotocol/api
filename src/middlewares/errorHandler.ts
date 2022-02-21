import { THXHttpError } from '@/util/errors';
import { NextFunction, Request, Response } from 'express';

type ErrorTypes = Error | THXHttpError;
// Error handler needs to have 4 arguments.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (error: ErrorTypes, req: Request, res: Response, next: NextFunction) => {
    const status = error instanceof THXHttpError ? error.status : 500;

    res.status(status);
    res.json({
        error: {
            message: error.message,
        },
    });
};
