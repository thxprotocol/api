import { NextFunction, Request, Response } from 'express';
import { HttpError } from '@/models/Error';

export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
    next(new HttpError(404, 'Route not found'));
};

// Error handler needs to have 4 arguments.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (error: HttpError, req: Request, res: Response, next: NextFunction) => {
    res.status(error.status || 500);
    res.json({
        error: {
            message: error.message,
        },
    });
};
