import async from 'async';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import passport from 'passport';
import { Account, AccountDocument, AuthToken } from '../models/Account';
import { Request, Response, NextFunction } from 'express';
import { IVerifyOptions } from 'passport-local';
import { WriteError } from 'mongodb';
import { validationResult } from 'express-validator';
import '../config/passport';
import logger from '../util/logger';
import { ethers } from 'ethers';

/**
 * @swagger
 * /logout:
 *   get:
 *     tags:
 *       - Authentication
 *     description: Sign out and end current session.
 */
export const logout = (req: Request, res: Response) => {
    req.logout();
    res.end();
};

/**
 * @swagger
 * /login:
 *   post:
 *     tags:
 *       - Authentication
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
 *       404:
 *         description: Account can not be found
 *       302:
 *          description: Redirect to /account
 *          headers:
 *             Location:
 *                type: string
 */
export const postLogin = async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json(errors.array()).end();
    }

    passport.authenticate('local', (err: Error, account: AccountDocument, info: IVerifyOptions) => {
        if (err) {
            return next(err);
        }
        if (!account) {
            return res.status(404).json({ msg: info.message }).end();
        }
        req.logIn(account, (err) => {
            if (err) {
                return next(err);
            }
            res.redirect('account');
        });
    })(req, res, next);
};

/**
 * @swagger
 * /signup:
 *   post:
 *     tags:
 *       - Authentication
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
 *       409:
 *         description: E-mail already exists in database.
 *       302:
 *          description: Redirect to /account
 *          headers:
 *             Location:
 *                type: string
 */
export const postSignup = async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json(errors.array()).end();
    }

    const wallet = ethers.Wallet.createRandom();
    const account = new Account({
        address: await wallet.getAddress(),
        privateKey: wallet.privateKey,
        email: req.body.email,
        password: req.body.password,
    });

    try {
        const existingUser = await Account.findOne({ email: req.body.email });

        if (existingUser) {
            res.status(422).end();
            return;
        }

        account.save((err) => {
            if (err) {
                throw Error(err);
            }

            req.logIn(account, (err) => {
                if (err) {
                    throw Error(err);
                }

                res.redirect('account');
            });
        });
    } catch (err) {
        logger.error(err.toString());
        res.status(500).json(err.toString());
    }
};

/**
 * @swagger
 * /account:
 *   get:
 *     tags:
 *       - Account
 *     description: Get profile information for your account
 *     produces:
 *       - application/json
 *     responses:
 *       500:
 *         description: Error during database lookup.
 *       200:
 *         description: OK
 *         schema:
 *          type: object
 *          properties:
 *              burnProofs:
 *                  type: array
 *                  items:
 *                      type: string
 *                      description: Burnproof transaction hash
 *              assetPools:
 *                  type: array
 *                  items:
 *                      type: string
 *                      description: Asset pool address
 *              firstName:
 *                  type: string
 *                  description: First name of the logged in user.
 *              lastName:
 *                  type: string
 *                  description: Last name of the logged in user.
 *              gender:
 *                  type: string
 *                  description: Gender of the logged in user
 *              location:
 *                  type: string
 *                  description: Provided location of the logged in user
 *              picture:
 *                  type: string
 *                  description: Picture provided by the user
 */
export const getAccount = async (req: Request, res: Response, next: NextFunction) => {
    const account = req.user as AccountDocument;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json(errors.array()).end();
    }

    Account.findById(account.id, (err, account: AccountDocument) => {
        if (err) {
            return next(err);
        }
        if (account) {
            res.send({ address: account.address, privateKey: account.privateKey, ...account.profile });
        }
    });
};

/**
 * @swagger
 * /account:
 *   patch:
 *     tags:
 *       - Account
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
 *       - name: burnProofs
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
 *         description: OK
 *       302:
 *          description: Redirect to /account
 *          headers:
 *             Location:
 *                type: string
 *
 */
export const patchAccount = async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json(errors.array()).end();
    }

    Account.findById((req.user as AccountDocument).id, (err, account: AccountDocument) => {
        if (err) {
            return next(err);
        }
        account.address = req.body.address || account.address;
        account.profile.firstName = req.body.firstName || account.profile.firstName;
        account.profile.lastName = req.body.lastName || account.profile.lastName;
        account.profile.gender = req.body.gender || account.profile.gender;
        account.profile.location = req.body.location || account.profile.location;
        account.profile.picture = req.body.picture || req.body.picture;
        account.profile.burnProofs = req.body.burnProofs || account.profile.burnProofs;
        account.profile.assetPools = req.body.assetPools || account.profile.assetPools;
        account.save((err: WriteError) => {
            if (err) {
                if (err.code === 11000) {
                    return res
                        .status(403)
                        .send({
                            msg: 'The email address you have entered is already associated with an account.',
                        })
                        .end();
                }
                return next(err);
            }
            return res.redirect('account');
        });
    });
};

/**
 * @swagger
 * /account/password:
 *   put:
 *     tags:
 *       - Account
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
 *        200:
 *         description: OK
 *        302:
 *          description: Redirect to /logout
 *          headers:
 *             Location:
 *                type: string
 */
export const putPassword = async (req: Request, res: Response, next: NextFunction) => {
    const account = req.user as AccountDocument;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json(errors.array()).end();
    }

    Account.findById(account.id, (err, account: AccountDocument) => {
        if (err) {
            return next(err);
        }
        account.password = req.body.password;
        account.save((err: WriteError) => {
            if (err) {
                return next(err);
            }
            return res.status(200).redirect('logout');
        });
    });
};

/**
 * @swagger
 * /account:
 *   delete:
 *     tags:
 *       - Account
 *     description: Delete current users account
 *     responses:
 *       200:
 *         description: OK
 *       302:
 *          description: Redirect to /login
 *          headers:
 *             Location:
 *                type: string
 */
export const deleteAccount = (req: Request, res: Response, next: NextFunction) => {
    const account = req.user as AccountDocument;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json(errors.array()).end();
    }

    Account.remove({ _id: account.id }, (err) => {
        if (err) {
            return next(err);
        }
        req.logout();
        return res.redirect('login');
    });
};

/**
 * @swagger
 * /reset/:token:
 *   post:
 *     tags:
 *       - Account
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
 *         description: OK
 */
export const postReset = async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json(errors.array()).end();
    }

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
            return res.redirect('/');
        },
    );
};

/**
 * @swagger
 * /forgot:
 *   post:
 *     tags:
 *       - Authentication
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
 *         description: OK
 */
export const postForgot = async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json(errors.array()).end();
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
                        return res.status(404).json({ msg: 'Account with that email address does not exist.' }).end();
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
            return res.redirect('/forgot');
        },
    );
};
