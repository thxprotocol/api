import async from 'async';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import passport from 'passport';
import { Account, AccountDocument, AuthToken } from '../models/Account';
import { Request, Response, NextFunction } from 'express';
import { WriteError } from 'mongodb';
import { validationResult } from 'express-validator';
import { ethers } from 'ethers';
import { HttpError } from '../models/Error';
import '../config/passport';

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
 *       '200':
 *         description: OK
 *       '302':
 *          description: Redirect. Redirects to `GET /account`
 *          headers:
 *             Location:
 *                schema:
 *                  type: string
 *       '400':
 *         description: Bad Request. Could indicate incorrect rewardPollDuration or proposeWithdrawPollDuration values.
 *       '500':
 *         description: Internal Server Error.
 *       '502':
 *         description: Bad Gateway. Received an invalid response from the network or database.
 */
export const postLogin = async (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('local', (error: Error, account: AccountDocument) => {
        if (error) {
            next(new HttpError(502, 'Account authenticate failed.', error));
            return;
        }
        req.logIn(account, (error) => {
            if (error) {
                next(new HttpError(502, 'Account login failed', error));
                return;
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
 *       - name: address
 *         in: body
 *         required: false
 *         type: string
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
 *       '201':
 *         description: Created
 *       '302':
 *          description: Redirect. Redirects to `GET /account`
 *          headers:
 *             Location:
 *                schema:
 *                  type: string
 *       '400':
 *         description: Bad Request. Indicated incorrect body parameters.
 *       '422':
 *         description: Duplicate. An account for this email already exists.
 *       '500':
 *         description: Internal Server Error.
 *       '502':
 *         description: Bad Gateway. Received an invalid response from the network or database.
 */
export const postSignup = async (req: Request, res: Response, next: NextFunction) => {
    let address = '',
        privateKey = '';

    if (req.body.address) {
        address = req.body.address;
    } else {
        const wallet = ethers.Wallet.createRandom();

        privateKey = wallet.privateKey;
        address = await wallet.getAddress();
    }

    const account = new Account({
        address,
        privateKey,
        email: req.body.email,
        password: req.body.password,
    });

    try {
        const existingUser = await Account.findOne({ email: req.body.email });

        if (existingUser) {
            next(new HttpError(422, 'A user for this e-mail already exists.'));
            return;
        }

        account.save((error) => {
            if (error) {
                next(new HttpError(502, 'Account save failed.', error));
                return;
            }

            req.logIn(account, (error) => {
                if (error) {
                    next(new HttpError(502, 'Account login failed', error));
                    return;
                }

                res.status(201).redirect('account');
            });
        });
    } catch (err) {
        next(new HttpError(500, 'Account signup failed.', err));
        return;
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
 *       '200':
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
 *              address:
 *                  type: string
 *                  description: Current wallet address for the logged in user.
 *              privateKey:
 *                  type: string
 *                  description: If no wallet address is provided during signup this field will contain a password encrypted base64 string for the private key of the random wallet address.
 *       '401':
 *         description: Unauthorized. Authenticate your request please.
 *       '403':
 *         description: Forbidden. Your account does not have access to this asset pool.
 *       '500':
 *         description: Internal Server Error.
 *       '502':
 *         description: Bad Gateway. Received an invalid response from the network or database.
 */
export const getAccount = async (req: Request, res: Response, next: NextFunction) => {
    const account = req.user as AccountDocument;

    Account.findById(account.id, (err, account: AccountDocument) => {
        if (err) {
            next(new HttpError(502, 'Account find failed', err));
            return;
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
 *       - name: address
 *         in: body
 *         required: false
 *         type: string
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
 *       '200':
 *         description: OK
 *       '302':
 *          description: Redirect to `GET /account`
 *          headers:
 *             Location:
 *                type: string
 *       '400':
 *         description: Bad Request. Could indicate incorrect rewardPollDuration or proposeWithdrawPollDuration values.
 *       '401':
 *         description: Unauthorized. Authenticate your request please.
 *       '422':
 *         description: Duplicate. An account for this email already exists.
 *       '500':
 *         description: Internal Server Error.
 *       '502':
 *         description: Bad Gateway. Received an invalid response from the network or database.
 *
 */
export const patchAccount = async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json(errors.array()).end();
    }

    Account.findById((req.user as AccountDocument).id, (err, account: AccountDocument) => {
        if (err) {
            next(new HttpError(502, 'Account find failed.', err));
            return;
        }
        if (req.body.address && ethers.utils.isAddress(req.body.address)) {
            account.address = req.body.address;
            account.privateKey = '';
        } else {
            account.address = account.address;
        }
        account.profile.firstName = req.body.firstName || account.profile.firstName;
        account.profile.lastName = req.body.lastName || account.profile.lastName;
        account.profile.gender = req.body.gender || account.profile.gender;
        account.profile.location = req.body.location || account.profile.location;
        account.profile.picture = req.body.picture || req.body.picture;
        account.profile.burnProofs = req.body.burnProofs || account.profile.burnProofs;
        account.profile.assetPools = req.body.assetPools || account.profile.assetPools;
        account.save((err) => {
            if (err) {
                if (err.code === 11000) {
                    next(new HttpError(422, 'A user for this e-mail already exists.', err));
                    return;
                }
                next(new HttpError(502, 'Account save failed', err));
                return;
            }
            res.redirect('account');
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
 *       '200':
 *         description: OK
 *       '302':
 *          description: Redirect to `GET /logout`
 *          headers:
 *             Location:
 *                type: string
 *       '400':
 *         description: Bad Request. Could indicate incorrect body parameters.
 *       '401':
 *         description: Unauthorized. Authenticate your request please.
 *       '500':
 *         description: Internal Server Error.
 *       '502':
 *         description: Bad Gateway. Received an invalid response from the network or database.
 */
export const putPassword = async (req: Request, res: Response, next: NextFunction) => {
    const account = req.user as AccountDocument;

    Account.findById(account.id, (err, account: AccountDocument) => {
        if (err) {
            next(new HttpError(502, 'Account find failed.', err));
            return;
        }
        account.password = req.body.password;
        account.save((err) => {
            if (err) {
                next(new HttpError(502, 'Account save failed.', err));
                return;
            }
            res.redirect('logout');
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
 *       '200':
 *         description: OK
 *       '302':
 *          description: Redirect to `GET /login`
 *          headers:
 *             Location:
 *                type: string
 *       '401':
 *         description: Unauthorized. Authenticate your request please.
 *       '500':
 *         description: Internal Server Error.
 *       '502':
 *         description: Bad Gateway. Received an invalid response from the network or database.
 */
export const deleteAccount = (req: Request, res: Response, next: NextFunction) => {
    const account = req.user as AccountDocument;

    Account.remove({ _id: account.id }, (err) => {
        if (err) {
            next(new HttpError(502, 'Account remove failed.', err));
            return;
        }
        req.logout();
        res.redirect('login');
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
 *       '200':
 *         description: OK
 *       '401':
 *         description: Unauthorized. Authenticate your request please.
 *       '403':
 *         description: Forbidden. Password reset token is invalid or has expired.
 *       '500':
 *         description: Internal Server Error.
 *       '502':
 *         description: Bad Gateway. Received an invalid response from the network or database.
 */
export const postReset = async (req: Request, res: Response, next: NextFunction) => {
    async.waterfall(
        [
            function resetPassword(done: Function) {
                Account.findOne({ passwordResetToken: req.params.token })
                    .where('passwordResetExpires')
                    .gt(Date.now())
                    .exec((err, account: any) => {
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
                        account.save((err: any) => {
                            if (err) {
                                next(new HttpError(502, 'Account save failed.', err));
                                return;
                            }
                            req.logIn(account, (err) => {
                                if (err) {
                                    next(new HttpError(502, 'Account login failed.', err));
                                    return;
                                }
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
 *       '200':
 *         description: OK
 *       '401':
 *         description: Unauthorized. Authenticate your request please.
 *       '403':
 *         description: Forbidden. Password reset token is invalid or has expired.
 *       '404':
 *         description: Not Found. Account does not exist.
 *       '500':
 *         description: Internal Server Error.
 *       '502':
 *         description: Bad Gateway. Received an invalid response from the network or database.
 */
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
                Account.findOne({ email: req.body.email }, (err, account: any) => {
                    if (err) {
                        next(new HttpError(502, 'Account find failed.', err));
                        return;
                    }
                    if (!account) {
                        next(new HttpError(404, 'Account does not exist.', err));
                        return;
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
                    from: 'peter@thxprotocol.com',
                    subject: 'Reset your THX password',
                    text: `You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\n
          Please click on the following link, or paste this into your browser to complete the process:\n\n
          http://${req.headers.host}/v1/reset/${token}\n\n
          If you did not request this, please ignore this email and your password will remain unchanged.\n`,
                };
                transporter.sendMail(mailOptions, (err) => {
                    res.send({ message: `An e-mail has been sent to ${account.email} with further instructions.` });
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
