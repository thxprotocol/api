import Provider from 'oidc-provider';
import express, { Request, Response, NextFunction, urlencoded } from 'express';
import configuration from './config';
import { HttpError } from '../models/Error';
import { ENVIRONMENT, GTM, ISSUER, SECURE_KEY } from '../util/secrets';
import MailService from '../services/MailService';
import AccountService from '../services/AccountService';

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

router.get('/interaction/:uid', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { uid, prompt, params } = await oidc.interactionDetails(req, res);
        let view, alert;

        switch (prompt.name) {
            case 'create': {
                view = 'signup';
                break;
            }
            case 'password': {
                view = 'password';
                break;
            }
            case 'login': {
                view = 'login';
                break;
            }
            case 'confirm': {
                view = 'login';
                if (params.signup_token) {
                    const { result, error } = await AccountService.verifySignupToken(params.signup_token);
                    alert = {
                        variant: result ? 'success' : 'danger',
                        message: result || error,
                    };
                }
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
    '/interaction/:uid/login',
    urlencoded({ extended: false }),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            let result;

            if (req.body.authenticationToken) {
                result = await AccountService.getSubForAuthenticationToken(
                    req.body.password,
                    req.body.passwordConfirm,
                    req.body.authenticationToken,
                    req.body.secureKey,
                );
            } else {
                result = await AccountService.getSubForCredentials(req.body.email, req.body.password);
            }

            const sub = result.sub;
            const error = result.error;

            if (error) {
                const alert = {
                    variant: 'success',
                    message: 'Please verify your account e-mail address. We have re-sent the verification e-mail.',
                };

                return res.render('login', {
                    uid: req.params.uid,
                    params: {},
                    alert,
                    gtm: GTM,
                });
            }

            const account = await AccountService.get(sub);

            if (!account.active) {
                const r = await MailService.sendConfirmationEmail(account, req.body.returnUrl);

                if (r && r.error) {
                    throw r.error;
                }
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
            return next(new HttpError(502, error.toString(), error));
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
