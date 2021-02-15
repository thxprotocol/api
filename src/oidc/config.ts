import jwks from '../jwks.json';
import MongoAdapter from './adapter';
import { Account } from '../models/Account';
import { AccountDocument } from '../models/Account';
import { ENVIRONMENT, SECURE_KEY } from '../util/secrets';

(async () => {
    if (ENVIRONMENT !== 'test') {
        await MongoAdapter.connect();
    }
})().catch((err) => {
    console.error(err);
    process.exitCode = 1;
});

// Configuration defaults:
// https://github.com/panva/node-oidc-provider/blob/master/lib/helpers/defaults.js
export default {
    debug: false,
    jwks,
    adapter: MongoAdapter,
    async findAccount(ctx: any, id: string) {
        const account: AccountDocument = await Account.findById(id);

        return {
            accountId: id,
            async claims() {
                return {
                    sub: id,
                    email: account.email,
                };
            },
        };
    },
    extraParams: ['authentication_token', 'secure_key'],
    claims: {
        openid: ['sub'],
        admin: ['admin'],
        user: ['user'],
        email: ['email'],
    },
    ttl: {
        AccessToken: 1 * 60 * 60, // 1 hour in seconds
        AuthorizationCode: 10 * 60, // 10 minutes in seconds
        ClientCredentials: 10 * 60, // 10 minutes in seconds
    },
    formats: {
        AccessToken: 'jwt',
        AuthorizationCode: 'jwt',
        ClientCredentials: 'jwt',
    },
    interactions: {
        url(ctx: any) {
            return `/interaction/${ctx.oidc.uid}`;
        },
    },
    features: {
        devInteractions: { enabled: false },
        clientCredentials: { enabled: true },
        encryption: { enabled: true },
        introspection: { enabled: true },
        registration: { enabled: true },
        rpInitiatedLogout: {
            enabled: true,
            logoutSource: async (ctx: any, form: any) => {
                ctx.body = `<!DOCTYPE html>
                <head>
                <title>Logout</title>
                </head>
                <body>
                ${form}
                <script>
                    function logout() {
                    var form = document.forms[0];
                    var input = document.createElement('input');
                    input.type = 'hidden';
                    input.name = 'logout';
                    input.value = 'yes';
                    form.appendChild(input);
                    form.submit();
                    }
                    logout()
                </script>
                </body>
                </html>`;
            },
        },
    },
    cookies: {
        long: { signed: true, maxAge: 1 * 24 * 60 * 60 * 1000 },
        short: { signed: true },
        keys: [SECURE_KEY.split(',')[0], SECURE_KEY.split(',')[1]],
    },
    async renderError(ctx: any, error: any) {
        ctx.type = 'html';
        ctx.body = `<!DOCTYPE html>
        <head>
        <title>Oops! Something went wrong...</title>
        </head>
        <body>
        <h1>Oops! something went wrong</h1>
        <pre>${JSON.stringify(error, null, 4)}</pre>
        </body>
        </html>`;
    },
};
