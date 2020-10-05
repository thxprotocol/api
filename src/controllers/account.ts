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
 * @swagger
 * /logout:
 *   get:
 *     tags:
 *       - auth
 *     description: Sign out and redirect.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: username
 *         description: Username to use for login.
 *         in: formData
 *         required: true
 *         type: string
 *       - name: password
 *         description: User's password.
 *         in: formData
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: login
 */
export const logout = (req: Request, res: Response) => {
    req.logout();
    res.redirect('/');
};

/**
 * @swagger
 * /login:
 *   post:
 *     tags:
 *       - auth
 *     description: Sign in using email and password.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: email
 *         description: Email to use for login.
 *         in: body
 *         required: true
 *         type: string
 *       - name: password
 *         description: Password to use for login.
 *         in: body
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: login
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
 * @swagger
 * /signup:
 *   post:
 *     tags:
 *       - auth
 *     description: Create an account using email and password.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: email
 *         description: Email to use for login.
 *         in: body
 *         required: true
 *         type: string
 *       - name: password
 *         description: Password to use for login.
 *         in: body
 *         required: true
 *         type: string
 *       - name: confirmPassword
 *         description: Password to use for confirmation.
 *         in: body
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: login
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
            return res.status(403).send({ msg: 'Account with that email address already exists.' });
        }
        account.save((err) => {
            if (err) {
                return next(err);
            }
            req.logIn(account, (err) => {
                if (err) {
                    return next(err);
                }
                res.redirect('/account');
            });
        });
    });
};

/**
 * @swagger
 * /account:
 *   get:
 *     tags:
 *       - account
 *     description: Get profile information for your account
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: login
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
 * @swagger
 * /account/profile:
 *   post:
 *     tags:
 *       - account
 *     description: Create profile information for your account.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: firstName
 *         in: body
 *         required: false
 *         type: string
 *       - name: lastName
 *         in: body
 *         required: false
 *         type: string
 *       - name: gender
 *         in: body
 *         required: false
 *         type: string
 *       - name: location
 *         in: body
 *         required: false
 *         type: string
 *       - name: picture
 *         in: body
 *         required: false
 *         type: string
 *       - name: burnProof
 *         in: body
 *         required: false
 *         type: array
 *         items:
 *          type: string
 *       - name: assetPools
 *         in: body
 *         required: false
 *         type: array
 *         items:
 *          type: string
 *     responses:
 *       200:
 *         description: login
 */
export const postUpdateProfile = async (req: Request, res: Response, next: NextFunction) => {
    Account.findById((req.user as AccountDocument).id, (err, account: AccountDocument) => {
        if (err) {
            return next(err);
        }
        account.profile.firstName = req.body.firstName || '';
        account.profile.lastName = req.body.lastName || '';
        account.profile.gender = req.body.gender || '';
        account.profile.location = req.body.location || '';
        account.profile.picture = req.body.picture || '';
        account.profile.burnProof = req.body.burnProof || [];
        account.profile.assetPools = req.body.assetPools || [];
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
 * @swagger
 * /account/password:
 *   post:
 *     tags:
 *       - account
 *     description: Update current password.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: email
 *         description: Email to use for login.
 *         in: body
 *         required: true
 *         type: string
 *       - name: password
 *         description: Password to use for login.
 *         in: body
 *         required: true
 *         type: string
 *       - name: confirmPassword
 *         description: Password to use for confirmation.
 *         in: body
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: login
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
 * @swagger
 * /account:
 *   delete:
 *     tags:
 *       - account
 *     description: Delete current users account
 *     responses:
 *       200:
 *         description: login
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
 * @swagger
 * /reset/:token:
 *   post:
 *     tags:
 *       - account
 *     description: Resets your password based on token in url.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: token
 *         in: body
 *         required: true
 *         type: string
 *       - name: password
 *         in: body
 *         required: true
 *         type: string
 *       - name: confirmPassword
 *         in: body
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: login
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
 * @swagger
 * /forgot:
 *   post:
 *     tags:
 *       - auth
 *     description: E-mails a link to reset the password.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: email
 *         in: body
 *         required: true
 *         type: string
 *       - name: password
 *         in: body
 *         required: true
 *         type: string
 *       - name: confirmPassword
 *         in: body
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: login
 */
export const postForgot = async (req: Request, res: Response, next: NextFunction) => {
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
