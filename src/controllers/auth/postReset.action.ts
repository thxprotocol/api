import async from 'async';
import { Account, AccountDocument } from '@/models/Account';
import { Request, Response, NextFunction } from 'express';
import { HttpError } from '@/models/Error';
import { sendMail } from '@/util/mail';

export const postReset = async (req: Request, res: Response, next: NextFunction) => {
    async.waterfall(
        [
            function resetPassword(done: Function) {
                Account.findOne({ passwordResetToken: req.params.token })
                    .where('passwordResetExpires')
                    .gt(Date.now())
                    .exec((err: Error, account: AccountDocument) => {
                        if (err) {
                            next(new HttpError(502, 'Account find passwordResetExpires failed.', err));
                            return;
                        }
                        if (!account) {
                            next(new HttpError(403, 'Password reset token is invalid or has expired.', err));
                            return;
                        }
                        account.password = req.body.password;
                        account.passwordResetToken = undefined;
                        account.passwordResetExpires = undefined;
                        account.save((err: Error) => {
                            if (err) {
                                next(new HttpError(502, 'Account save failed.', err));
                                return;
                            }
                            done(err, account);
                        });
                    });
            },
            async function sendResetPasswordEmail(account: AccountDocument, done: Function) {
                try {
                    await sendMail(
                        account.email,
                        'Your password has been changed',
                        `Hello,\n\nThis is a confirmation that the password for your account ${account.email} has just been changed.\n`,
                    );
                    res.json({ message: 'Success! Your password has been changed.' });
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
            return res.redirect('/');
        },
    );
};
