import { Request, Response } from 'express';
import { HttpError } from '../models/Error';

export const errorHandler = (error: HttpError, req: Request, res: Response) => {
    res.status(error.status || 500);
    res.json({
        error: {
            message: error.message,
        },
    });
};
