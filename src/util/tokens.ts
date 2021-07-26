import crypto from 'crypto';
import { Account } from '@/models/Account';
import { DASHBOARD_URL } from './secrets';

export function createRandomToken() {
    const buf = crypto.randomBytes(16);
    return buf.toString('hex');
}

export async function checkSignupToken(signupToken: string) {
    const account = await Account.findOne({ signupToken });

    if (!account) {
        return {
            variant: 'danger',
            message: 'Could not find an account for this signup_token.',
        };
    }

    if (account.signupTokenExpires < Date.now()) {
        return {
            variant: 'danger',
            message: 'This signup_token has expired.',
        };
    }

    account.signupToken = '';
    account.signupTokenExpires = null;
    account.active = true;

    await account.save();

    return {
        variant: 'success',
        message: 'Congratulations! Your e-mail address has been verified.',
    };
}

export function createAccountVerificationEmail(signupToken: string) {
    return (
        'Activate your account: <a href="' +
        DASHBOARD_URL +
        '/verify?signup_token=' +
        signupToken +
        '" target="_blank">Click this link</a> or copy this in your address bar: ' +
        DASHBOARD_URL +
        '/verify?signup_token=' +
        signupToken
    );
}
