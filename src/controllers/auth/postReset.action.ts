import async from 'async';
import nodemailer from 'nodemailer';
import { Account, AccountDocument } from '../../models/Account';
import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../../models/Error';

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
            function sendResetPasswordEmail(account: AccountDocument, done: Function) {
                const transporter = nodemailer.createTransport({
                    service: 'SendGrid',
                    auth: {
                        user: process.env.SENDGRID_USER,
                        pass: process.env.SENDGRID_PASSWORD,
                    },
                });
                const mailOptions = {
                    to: account.email,
                    from: 'peter@thxprotocol.com',
                    subject: 'Your password has been changed',
                    text: `Hello,\n\nThis is a confirmation that the password for your account ${account.email} has just been changed.\n`,
                };
                transporter.sendMail(mailOptions, (err) => {
                    res.json({ message: 'Success! Your password has been changed.' });
                    done(err);
                });
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
