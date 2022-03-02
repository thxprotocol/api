import { authClient } from '@/util/auth';
import { Request, Response } from 'express';
import { body } from 'express-validator';

export const createLoginValidation = [
    body('email').exists(),
    body('email', 'Email is not valid').isEmail(),
    body('password').exists(),
    body('password', 'Password must be at least 4 characters long').isLength({ min: 16 }),
];

export const postLogin = async (req: Request, res: Response) => {
    const r = await authClient.post('/account/login', { email: req.body.email, password: req.body.password });
    res.status(r.status).json(r.data);
};
