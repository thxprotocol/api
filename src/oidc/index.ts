import Provider from 'oidc-provider';
import express, { Request, Response, NextFunction, urlencoded } from 'express';
import configuration from './config';
import { AccountDocument } from '../models/Account';
import { Account } from '../models/Account';
import { HttpError } from '../models/Error';
import { ENVIRONMENT, GTM, ISSUER, SECURE_KEY } from '../util/secrets';
import { decryptString } from '../util/decrypt';
import { sendMail } from '../util/mail';
import { createRandomToken, checkSignupToken } from '../util/tokens';

function createAccountVerificationEmail(returnUrl: string, signupToken: string) {
    return (
        'Hi! Thanks for your sign up! We will make this e-mail more pretty in the near future. For now you can activate your account over here: <a href="' +
        returnUrl +
        '/verify?signup_token=' +
        signupToken +
        '&return_url=' +
        returnUrl +
        '" target="_blank">Click this link</a> or copy this in your address bar: ' +
        returnUrl +
        '/verify?signup_token=' +
        signupToken +
        '&return_url=' +
        returnUrl
    );
}

const oidc = new Provider(ISSUER, configuration as any);
const router = express.Router();

oidc.proxy = true;
oidc.keys = SECURE_KEY.split(',');

if (ENVIRONMENT !== 'development' && ENVIRONMENT !== 'production') {
    const { invalidate: orig } = (oidc.Client as any).Schema.prototype;
    (oidc.Client as any).Schema.prototype.invalidate = function invalidate(message: any, code: any) {
        if (code === 'implicit-force-https' || code === 'implicit-forbid-localhost') return;
        orig.call(this, message);
    };
}

router.get('/interaction/:uid', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { uid, prompt, params } = await oidc.interactionDetails(req, res);

        switch (params.prompt) {
            case 'create': {
                return res.render('signup', {
                    uid,
                    params,
                    title: 'Signup',
                    alert: null,
                    gtm: GTM,
                });
            }
            case 'password': {
                return res.render('password', {
                    uid,
                    params,
                    title: 'Signup',
                    alert: null,
                    gtm: GTM,
                });
            }
        }

        switch (prompt.name) {
            case 'create': {
                res.render('signup', {
                    uid,
                    params,
                    title: 'Signup',
                    alert: null,
                    gtm: GTM,
                });
                break;
            }
            case 'password': {
                res.render('password', {
                    uid,
                    params,
                    title: 'Password',
                    alert: null,
                    gtm: GTM,
                });
                break;
            }
            case 'login': {
                res.render('login', {
                    uid,
                    params,
                    title: 'Sign-in',
                    alert: params.signup_token ? await checkSignupToken(params.signup_token) : null,
                    gtm: GTM,
                });
                break;
            }
            case 'consent': {
                const consent: any = {};

                consent.rejectedScopes = [];
                consent.rejectedClaims = [];
                consent.replace = false;

                const result = { consent };

                await oidc.interactionFinished(req, res, result, { mergeWithLastSubmission: true });
                break;
            }
            default:
                return undefined;
        }
    } catch (err) {
        next(new HttpError(500, 'Loading view failed.', err));
    }
});

router.post(
    '/interaction/:uid/create',
    urlencoded({ extended: false }),
    async (req: Request, res: Response, next: NextFunction) => {
        const existingUser = await Account.findOne({ email: req.body.email });

        if (existingUser) {
            return res.render('signup', {
                uid: req.params.uid,
                title: 'Signup',
                params: req.params,
                alert: {
                    variant: 'danger',
                    message: 'A user for this e-mail already exists.',
                },
                gtm: GTM,
            });
        }

        if (req.body.password !== req.body.confirmPassword) {
            return res.render('signup', {
                uid: req.params.uid,
                title: 'Signup',
                params: req.params,
                alert: {
                    variant: 'danger',
                    message: 'Provided passwords are not identical.',
                },
                gtm: GTM,
            });
        }

        if (!req.body.acceptTermsPrivacy) {
            return res.render('signup', {
                uid: req.params.uid,
                params: req.params,
                title: 'Signup',
                alert: {
                    variant: 'danger',
                    message: 'Please accept the terms of use and privacy statement.',
                },
                gtm: GTM,
            });
        }

        const account = new Account({
            active: false,
            email: req.body.email,
            password: req.body.password,
            acceptTermsPrivacy: req.body.acceptTermsPrivacy || false,
            acceptUpdates: req.body.acceptUpdates || false,
            signupToken: createRandomToken(),
            signupTokenExpires: Date.now() + 1000 * 60 * 60 * 24, // 24 hours,
        });

        try {
            const html = createAccountVerificationEmail(req.body.returnUrl, account.signupToken);

            await sendMail(req.body.email, 'Confirm your THX Account', html);

            try {
                await account.save();

                return res.render('signup', {
                    uid: req.params.uid,
                    title: 'Signup',
                    params: req.params,
                    alert: {
                        variant: 'success',
                        message: 'Verify your e-mail address by clicking the link we just sent you.',
                    },
                    gtm: GTM,
                });
            } catch (err) {
                return next(new HttpError(502, 'Could not save the account.', err));
            }
        } catch (e) {
            return next(new HttpError(502, 'Could not send verification e-mail.', e));
        }
    },
);

router.post(
    '/interaction/:uid/login',
    urlencoded({ extended: false }),
    async (req: Request, res: Response, next: NextFunction) => {
        async function getSubForAuthenticationToken(authenticationToken: string, secureKey: string) {
            try {
                const account: AccountDocument = await Account.findOne({ authenticationToken })
                    .where('authenticationTokenExpires')
                    .gt(Date.now())
                    .exec();

                if (!account) {
                    throw account;
                }

                try {
                    if (req.body.password !== req.body.passwordConfirm) {
                        throw 'Passwords not equal.';
                    }

                    const oldPassword = decryptString(secureKey, SECURE_KEY.split(',')[0]);

                    account.privateKey = decryptString(account.privateKey, oldPassword);
                    account.password = req.body.password;

                    await account.save();

                    return account._id.toString();
                } catch (err) {
                    return next(new HttpError(401, 'Private key can not be decrypted', err));
                }
            } catch (err) {
                return next(new HttpError(401, 'Token is invalid or expired.', err));
            }
        }

        async function getSubForCredentials(returnUrl: string, email: string, password: string) {
            const account: AccountDocument = await Account.findOne({ email });

            if (!account) {
                return next(new HttpError(404, 'Could not find an account for this e-mail address.'));
            }

            if (!account.active) {
                account.signupToken = createRandomToken();
                account.signupTokenExpires = Date.now() + 1000 * 60 * 60 * 24; // 24 hours,

                try {
                    const html = createAccountVerificationEmail(returnUrl, account.signupToken);

                    await sendMail(req.body.email, 'Confirm your THX Account', html);
                } catch (e) {
                    return next(new HttpError(400, 'Could not send verification e-mail.', e));
                }

                await account.save();

                return {
                    error: new HttpError(
                        502,
                        'Please verify your account e-mail address. We have re-sent the verification e-mail.',
                    ),
                };
            }

            try {
                const { error, isMatch } = account.comparePassword(password);

                if (error) {
                    throw error;
                }

                if (!isMatch) {
                    throw isMatch;
                }

                return account._id.toString();
            } catch (err) {
                return next(new HttpError(400, 'Comparing passwords failed.', err));
            }
        }

        try {
            let account;

            if (req.body.authenticationToken) {
                account = await getSubForAuthenticationToken(req.body.authenticationToken, req.body.secureKey);
            } else {
                account = await getSubForCredentials(req.body.returnUrl, req.body.email, req.body.password);
            }

            if (account && account.error) {
                res.render('login', {
                    uid: req.params.uid,
                    title: 'Sign-in',
                    params: {},
                    alert: {
                        variant: 'success',
                        message: 'Please verify your account e-mail address. We have re-sent the verification e-mail.',
                    },
                    gtm: GTM,
                });
            } else {
                const result = {
                    login: {
                        account,
                    },
                };

                await oidc.interactionFinished(req, res, result, { mergeWithLastSubmission: true });
            }
        } catch (err) {
            return next(new HttpError(502, 'Account read failed.', err));
        }
    },
);

router.get('/interaction/:uid/abort', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = {
            error: 'access_denied',
            error_description: 'End-User aborted interaction',
        };
        await oidc.interactionFinished(req, res, result, { mergeWithLastSubmission: false });
    } catch (err) {
        next(err);
    }
});

export { oidc, router };
