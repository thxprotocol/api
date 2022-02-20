import { NextFunction, Request, Response } from 'express';
import { HttpError } from '@/models/Error';
import { THXHttpError } from '@/util/errors';
import { NODE_ENV } from '@/util/secrets';

interface ErrorResponse {
    error: {
        message: string;
        error?: Error;
        rootMessage?: string;
        stack?: string;
    };
}

// Error handler needs to have 4 arguments.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorOutput = (error: Error, req: Request, res: Response, next: NextFunction) => {
    let status = 500;
    const response: ErrorResponse = { error: { message: 'Unable to fulfill request due to unknown error' } };
    if (error instanceof THXHttpError) {
        status = error.status;
        response.error.message = error.message;
    } else if (NODE_ENV !== 'production') {
        response.error.error = error;
        response.error.stack = error.stack;
    }

    res.status(status);
    res.json(response);
};
