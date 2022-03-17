import { Request, Response } from 'express';
import AccountProxy from '@/proxies/AccountProxy';
import { body, check } from 'express-validator';
import { isAddress } from 'web3-utils';
import { DuplicateEmailError } from '@/util/errors';

export const createAccountValidation = [
    body('email').exists(),
    body('password').exists(),
    body('address')
        .optional()
        .custom((value) => {
            return isAddress(value);
        }),
    check('email', 'Email is not valid').isEmail(),
    check('password', 'Password must be at least 4 characters long').isLength({ min: 16 }),
];

export const postAccount = async (req: Request, res: Response) => {
    const isDuplicate = await AccountProxy.isEmailDuplicate(req.body.email);

    if (isDuplicate) {
        throw new DuplicateEmailError();
    }

    const account = await AccountProxy.signupFor(req.body.email, req.body.password, req.body.address);

    res.status(201).json({ id: account.id, address: account.address });
};
