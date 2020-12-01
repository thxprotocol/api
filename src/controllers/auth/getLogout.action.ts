import { Request, Response } from 'express';

/**
 * @swagger
 * /logout:
 *   get:
 *     tags:
 *       - Authentication
 *     description: Sign out and end current session.
 */
export const getLogout = (req: Request, res: Response) => {
    req.logout();
    res.end();
};
