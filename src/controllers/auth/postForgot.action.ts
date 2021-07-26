import async from 'async';
import crypto from 'crypto';
import { Account, AccountDocument, AuthToken } from '@/models/Account';
import { Request, Response, NextFunction } from 'express';
import { HttpError } from '@/models/Error';
import { sendMail } from '@/util/mail';

export const postForgot = async (req: Request, res: Response, next: NextFunction) => {
    async.waterfall(
        [
            function createRandomToken(done: Function) {
                crypto.randomBytes(16, (err, buf) => {
                    const token = buf.toString('hex');
                    done(err, token);
                });
            },
            function setRandomToken(token: AuthToken, done: Function) {
                Account.findOne({ email: req.body.email }, (err: Error, account: AccountDocument) => {
                    if (err) {
                        next(new HttpError(502, 'Account find failed.', err));
                        return;
                    }
                    if (!account) {
                        next(new HttpError(404, 'Account does not exist.', err));
                        return;
                    }
                    account.passwordResetToken = token.accessToken;
                    account.passwordResetExpires = Date.now() + 3600000; // 1 hour
                    account.save((err: Error) => {
                        done(err, token, account);
                    });
                });
            },
            async function sendForgotPasswordEmail(token: AuthToken, account: AccountDocument, done: Function) {
                try {
                    await sendMail(
                        account.email,
                        'Reset your THX password',
                        `You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\n
                    Please click on the following link, or paste this into your browser to complete the process:\n\n
                    http://${req.headers.host}/v1/reset/${token}\n\n
                    If you did not request this, please ignore this email and your password will remain unchanged.\n`,
                    );
                    res.json({ message: `An e-mail has been sent to ${account.email} with further instructions.` });
                    done();
                } catch (e) {
                    next(new HttpError(502, 'E-mail sent failed.', e));
                    return;
                }
            },
        ],
        (err) => {
            if (err) {
                return next(err);
            }
            return res.redirect('/forgot');
        },
    );
};
