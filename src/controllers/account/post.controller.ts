import { Request, Response } from 'express';
import MemberService from '@/services/MemberService';
import AccountProxy from '@/proxies/AccountProxy';
import MembershipService from '@/services/MembershipService';
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
    const { isDuplicate } = await AccountProxy.isEmailDuplicate(req.body.email);

    if (isDuplicate) {
        throw new DuplicateEmailError();
    }

    const { account } = await AccountProxy.signupFor(req.body.email, req.body.password, req.body.address);

    if (req.assetPool) {
        await MemberService.addMember(req.assetPool, account.address);
        await MembershipService.addMembership(account.id, req.assetPool);
    }

    res.status(201).json({ id: account.id, address: account.address });
};
