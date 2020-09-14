import async from 'async';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import passport from 'passport';
import { Account, AccountDocument, AuthToken } from '../models/Account';
import { Request, Response, NextFunction } from 'express';
import { IVerifyOptions } from 'passport-local';
import { WriteError } from 'mongodb';
import { check, sanitize, validationResult } from 'express-validator';
import '../config/passport';
import { handleValidation } from '../util/validation';

/**
 * Log out.
 * @route GET /logout
 */
export const logout = (req: Request, res: Response) => {
    req.logout();
    res.redirect('/');
};

/**
 * Sign in using email and password.
 * @route POST /login
 */
export const postLogin = async (req: Request, res: Response, next: NextFunction) => {
    await sanitize('email').normalizeEmail({ gmail_remove_dots: false }).run(req);

    handleValidation(req, res);

    passport.authenticate('local', (err: Error, account: AccountDocument, info: IVerifyOptions) => {
        if (err) {
            return next(err);
        }
        if (!account) {
            return res.send({ msg: info.message });
        }
        req.logIn(account, (err) => {
            if (err) {
                return next(err);
            }
            res.send({ msg: 'Success! You are logged in.' });
        });
    })(req, res, next);
};

/**
 * Create a new local account.
 * @route POST /signup
 */
export const postSignup = async (req: Request, res: Response, next: NextFunction) => {
    await sanitize('email').normalizeEmail({ gmail_remove_dots: false }).run(req);
    handleValidation(req, res);

    const account = new Account({
        email: req.body.email,
        password: req.body.password,
    });

    Account.findOne({ email: req.body.email }, (err, existingUser) => {
        if (err) {
            return next(err);
        }
        if (existingUser) {
            return res.send({ msg: 'Account with that email address already exists.' });
        }
        account.save((err) => {
            if (err) {
                return next(err);
            }
            req.logIn(account, (err) => {
                if (err) {
                    return next(err);
                }
                res.redirect('/');
            });
        });
    });
};

/**
 * Profile page.
 * @route GET /account
 */
export const getAccount = async (req: Request, res: Response, next: NextFunction) => {
    const account = req.user as AccountDocument;
    if (!account) {
        return res.send({ msg: 'The UID for this session is not found.' });
    }

    Account.findById(account.id, (err, account: AccountDocument) => {
        if (err) {
            return next(err);
        }
        if (account) {
            res.send(account);
        }
    });
};

/**
 * Update profile information.
 * @route POST /account/profile
 */
export const postUpdateProfile = async (req: Request, res: Response, next: NextFunction) => {
    await sanitize('email').normalizeEmail({ gmail_remove_dots: false }).run(req);

    handleValidation(req, res);

    Account.findById((req.user as AccountDocument).id, (err, account: AccountDocument) => {
        if (err) {
            return next(err);
        }
        account.email = req.body.email || '';
        account.profile.name = req.body.name || '';
        account.profile.gender = req.body.gender || '';
        account.profile.location = req.body.location || '';
        // TODO Picture should be handled
        account.profile.rewardPools = req.body.rewardPools || '';
        account.save((err: WriteError) => {
            if (err) {
                if (err.code === 11000) {
                    return res.send({
                        msg: 'The email address you have entered is already associated with an account.',
                    });
                }
                return next(err);
            }
            res.send({ msg: 'Profile information has been updated.' });
        });
    });
};

/**
 * Update current password.
 * @route POST /account/password
 */
export const postUpdatePassword = async (req: Request, res: Response, next: NextFunction) => {
    handleValidation(req, res);

    const account = req.user as AccountDocument;
    Account.findById(account.id, (err, account: AccountDocument) => {
        if (err) {
            return next(err);
        }
        account.password = req.body.password;
        account.save((err: WriteError) => {
            if (err) {
                return next(err);
            }
            res.send({ msg: 'Password has been changed.' });
        });
    });
};

/**
 * Delete user account.
 * @route POST /account/delete
 */
export const deleteAccount = (req: Request, res: Response, next: NextFunction) => {
    const account = req.user as AccountDocument;
    Account.remove({ _id: account.id }, (err) => {
        if (err) {
            return next(err);
        }
        req.logout();
        return res.send({ msg: 'Your account has been deleted.' });
    });
};

/**
 * Process the reset password request.
 * @route POST /reset/:token
 */
export const postReset = async (req: Request, res: Response, next: NextFunction) => {
    handleValidation(req, res);

    async.waterfall(
        [
            function resetPassword(done: Function) {
                Account.findOne({ passwordResetToken: req.params.token })
                    .where('passwordResetExpires')
                    .gt(Date.now())
                    .exec((err, account: any) => {
                        if (err) {
                            return next(err);
                        }
                        if (!account) {
                            return res.send({ msg: 'Password reset token is invalid or has expired.' });
                        }
                        account.password = req.body.password;
                        account.passwordResetToken = undefined;
                        account.passwordResetExpires = undefined;
                        account.save((err: WriteError) => {
                            if (err) {
                                return next(err);
                            }
                            req.logIn(account, (err) => {
                                done(err, account);
                            });
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
                    from: 'peter@peterpolman.nl',
                    subject: 'Your password has been changed',
                    text: `Hello,\n\nThis is a confirmation that the password for your account ${account.email} has just been changed.\n`,
                };
                transporter.sendMail(mailOptions, (err) => {
                    res.send({ msg: 'Success! Your password has been changed.' });
                    done(err);
                });
            },
        ],
        (err) => {
            if (err) {
                return next(err);
            }
            res.redirect('/');
        },
    );
};

/**
 * Create a random token, then the send account an email with a reset link.
 * @route POST /forgot
 */
export const postForgot = async (req: Request, res: Response, next: NextFunction) => {
    await check('email', 'Please enter a valid email address.').isEmail().run(req);
    await sanitize('email').normalizeEmail({ gmail_remove_dots: false }).run(req);

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(404).send(errors.array());
    }

    async.waterfall(
        [
            function createRandomToken(done: Function) {
                crypto.randomBytes(16, (err, buf) => {
                    const token = buf.toString('hex');
                    done(err, token);
                });
            },
            function setRandomToken(token: AuthToken, done: Function) {
                Account.findOne({ email: req.body.email }, (err, account: any) => {
                    if (err) {
                        return done(err);
                    }
                    if (!account) {
                        return res.send({ msg: 'Account with that email address does not exist.' });
                    }
                    account.passwordResetToken = token;
                    account.passwordResetExpires = Date.now() + 3600000; // 1 hour
                    account.save((err: WriteError) => {
                        done(err, token, account);
                    });
                });
            },
            function sendForgotPasswordEmail(token: AuthToken, account: AccountDocument, done: Function) {
                const transporter = nodemailer.createTransport({
                    service: 'SendGrid',
                    auth: {
                        user: process.env.SENDGRID_USER,
                        pass: process.env.SENDGRID_PASSWORD,
                    },
                });
                const mailOptions = {
                    to: account.email,
                    from: 'peter@peterpolman.nl',
                    subject: 'Reset your THX password',
                    text: `You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\n
          Please click on the following link, or paste this into your browser to complete the process:\n\n
          http://${req.headers.host}/v1/reset/${token}\n\n
          If you did not request this, please ignore this email and your password will remain unchanged.\n`,
                };
                transporter.sendMail(mailOptions, (err) => {
                    res.send({ msg: `An e-mail has been sent to ${account.email} with further instructions.` });
                    done(err);
                });
            },
        ],
        (err) => {
            if (err) {
                return next(err);
            }
            res.redirect('/forgot');
        },
    );
};
