import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../models/Error';

export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
    next(new HttpError(404, 'Route not found'));
};

export const errorHandler = (error: HttpError, req: Request, res: Response) => {
    res.status(error.status || 500);
    res.json({
        error: {
            message: error.message,
        },
    });
};
