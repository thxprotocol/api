import { Account } from '../models/Account';
import { AccountDocument } from '../models/Account';
import jwks from '../jwks.json';
import MongoAdapter from './adapter';

(async () => {
    await MongoAdapter.connect();
})().catch((err) => {
    console.error(err);
    process.exitCode = 1;
});

// Configuration defaults:
// https://github.com/panva/node-oidc-provider/blob/master/lib/helpers/defaults.js
export default {
    debug: true,
    adapter: MongoAdapter,
    async findAccount(ctx: any, id: string) {
        const account: AccountDocument = await Account.findById(id);

        return {
            accountId: id,
            async claims() {
                return {
                    sub: id,
                    email: account.email,
                    assetPools: account.profile.assetPools,
                    burnProofs: account.profile.burnProofs,
                    address: account.address,
                    privateKey: account.privateKey,
                };
            },
        };
    },
    claims: {
        openid: ['sub'],
        admin: ['admin'],
        user: ['user'],
        email: ['email'],
        address: ['address'],
        privateKey: ['privateKey'],
        profile: ['assetPools', 'burnProofs'],
    },
    ttl: {
        AccessToken: 1 * 60 * 60, // 1 hour in seconds
        AuthorizationCode: 10 * 60, // 10 minutes in seconds
        IdToken: 1 * 60 * 60, // 1 hour in seconds
        DeviceCode: 10 * 60, // 10 minutes in seconds
        RefreshToken: 1 * 24 * 60 * 60, // 1 day in seconds
    },
    jwks,
    formats: {
        AccessToken: 'jwt',
        ClientCredentials: 'jwt',
    },
    clientBasedCORS(ctx: any, origin: any, client: any) {
        console.log('CTX', ctx);
        console.log('origin', origin);
        console.log('client', client);
        return true;
    },
    interactions: {
        url(ctx: any) {
            return `/interaction/${ctx.oidc.uid}`;
        },
    },
    async renderError(ctx: any, error: any) {
        ctx.type = 'html';
        ctx.body = `<!DOCTYPE html>
        <head>
        <title>Oops! Something went wrong...</title>
        </head>
        <body>
        <h1>oops! something went wrong</h1>
        <pre>${JSON.stringify(error, null, 4)}</pre>
        </body>
        </html>`;
    },
    // TODO https://github.com/panva/node-oidc-provider/blob/master/docs/README.md#featuresrpinitiatedlogout
    async logoutSource(ctx: any, form: any) {
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
    features: {
        devInteractions: { enabled: false },
        clientCredentials: { enabled: true },
        encryption: { enabled: true },
        introspection: { enabled: true },
        registration: { enabled: true },
    },
};
