import Provider from 'oidc-provider';
import express, { Request, Response, NextFunction, urlencoded } from 'express';
import configuration from './config';
import { HttpError } from '../models/Error';
import { ENVIRONMENT, GTM, ISSUER, SECURE_KEY } from '../util/secrets';
import MailService from '../services/MailService';
import AccountService from '../services/AccountService';
import { IAccount } from 'src/models/Account';

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

const ERROR_SENDING_MAIL_FAILED = 'Could not send your confirmation e-mail.';
const ERROR_ACCOUNT_NOT_ACTIVE = 'Your e-mail is not verified. We have re-sent the activation link.';
const ERROR_NO_ACCOUNT = 'We could not find an account for this e-mail and password combination.';
const ERROR_AUTH_LINK = 'Your wallet is encrypted by another party. Please ask them to send you a login link.';

router.get('/interaction/:uid', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { uid, prompt, params } = await oidc.interactionDetails(req, res);
        let view, alert;

        switch (prompt.name) {
            case 'login': {
                view = 'login';
                break;
            }
            case 'consent': {
                const consent: any = {};

                consent.rejectedScopes = [];
                consent.rejectedClaims = [];
                consent.replace = false;

                const result = { consent };

                return await oidc.interactionFinished(req, res, result, { mergeWithLastSubmission: true });
            }
        }

        switch (params.prompt) {
            case 'confirm': {
                view = 'confirm';
                const { error } = await AccountService.verifySignupToken(params.signup_token);

                if (error) {
                    alert = {
                        variant: 'danger',
                        message: error,
                    };
                }

                break;
            }
            case 'create': {
                view = 'signup';
                break;
            }
            case 'login': {
                view = 'login';
                break;
            }
        }

        res.render(view, {
            uid,
            params,
            alert,
            gtm: GTM,
        });
    } catch (err) {
        return next(new HttpError(500, 'Loading view failed.', err));
    }
});

router.post(
    '/interaction/:uid/create',
    urlencoded({ extended: false }),
    async (req: Request, res: Response, next: NextFunction) => {
        const { result, error } = await AccountService.isEmailDuplicate(req.body.email);
        const alert = { variant: 'danger', message: '' };

        if (result) {
            alert.message = 'An account with this e-mail address already exists.';
        } else if (error) {
            alert.message = 'Could not check your e-mail address for duplicates.';
        } else if (req.body.password !== req.body.confirmPassword) {
            alert.message = 'The provided passwords are not identical.';
        } else if (!req.body.acceptTermsPrivacy) {
            alert.message = 'Please accept the terms of use and privacy statement.';
        }

        if (alert.message) {
            return res.render('signup', {
                uid: req.params.uid,
                params: {
                    return_url: req.body.returnUrl,
                    signup_email: req.body.email,
                },
                alert,
                gtm: GTM,
            });
        }

        const account = AccountService.signup(
            req.body.email,
            req.body.password,
            req.body.acceptTermsPrivacy,
            req.body.acceptUpdates,
        );

        try {
            const { result, error } = await MailService.sendConfirmationEmail(account, req.body.returnUrl);

            if (error) {
                throw new Error(ERROR_SENDING_MAIL_FAILED);
            }

            try {
                return res.render('signup', {
                    uid: req.params.uid,
                    params: {
                        return_url: req.body.returnUrl,
                        signup_email: req.body.email,
                    },
                    alert: {
                        variant: 'success',
                        message:
                            'Verify your e-mail address by clicking the link we just sent you. You can close this window.',
                    },
                    gtm: GTM,
                });
            } catch (error) {
                return next(new HttpError(502, error.toString(), error));
            }
        } catch (error) {
            return next(new HttpError(502, error.toString(), error));
        }
    },
);

router.post(
    '/interaction/:uid/password',
    urlencoded({ extended: false }),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const alert = { variant: 'danger', message: '' };
            if (!req.body.acceptTermsPrivacy) {
                alert.message = 'Please accept the terms of use and privacy statement.';
            }
            if (alert.message) {
                return res.render('login', {
                    uid: req.params.uid,
                    params: {
                        return_url: req.body.returnUrl,
                        authentication_token: req.body.authenticationToken,
                        secure_key: req.body.secureKey,
                    },
                    alert,
                    gtm: GTM,
                });
            }

            const { sub, error } = await AccountService.getSubForAuthenticationToken(
                req.body.password,
                req.body.passwordConfirm,
                req.body.authenticationToken,
                req.body.secureKey,
            );

            if (error) {
                return res.render('login', {
                    uid: req.params.uid,
                    params: {
                        return_url: req.body.returnUrl,
                        authentication_token: req.body.authenticationToken,
                        secure_key: req.body.secureKey,
                    },
                    alert: {
                        variant: 'danger',
                        message: error.toString(),
                    },
                    gtm: GTM,
                });
            } else {
                const account = await AccountService.get(sub);
                const updates: IAccount = {
                    acceptTermsPrivacy: req.body.acceptTermsPrivacy,
                    acceptUpdates: req.body.acceptUpdates,
                };

                await AccountService.update(account, updates);
            }

            await oidc.interactionFinished(
                req,
                res,
                {
                    login: {
                        account: sub,
                    },
                },
                { mergeWithLastSubmission: true },
            );
        } catch (error) {
            return next(new HttpError(500, error.toString(), error));
        }
    },
);

router.post(
    '/interaction/:uid/login',
    urlencoded({ extended: false }),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { sub, error } = await AccountService.getSubForCredentials(req.body.email, req.body.password);
            const alert = {
                variant: 'danger',
                message: '',
            };

            if (error) {
                alert.message = error.toString();
            }

            const account = await AccountService.get(sub);

            if (!account) {
                alert.message = ERROR_NO_ACCOUNT;
            }

            if (account && !account.active) {
                const { result, error } = await MailService.sendConfirmationEmail(account, req.body.returnUrl);

                if (error) {
                    alert.message = error.toString();
                }

                if (result) {
                    alert.message = ERROR_ACCOUNT_NOT_ACTIVE;
                }
            }

            if (account && account.privateKey) {
                alert.message = ERROR_AUTH_LINK;
            }

            if (alert.message) {
                return res.render('login', {
                    uid: req.params.uid,
                    params: {},
                    alert,
                    gtm: GTM,
                });
            } else {
                await oidc.interactionFinished(
                    req,
                    res,
                    {
                        login: {
                            account: sub,
                        },
                    },
                    { mergeWithLastSubmission: true },
                );
            }
        } catch (error) {
            return next(new HttpError(500, error.toString(), error));
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
        return next(err);
    }
});

export { oidc, router };
