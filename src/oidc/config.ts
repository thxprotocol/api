import { Account } from '../models/Account';
import { AccountDocument } from '../models/Account';
import jwks from '../jwks.json';
import adapter from './adapter';

// Configuration defaults:
// https://github.com/panva/node-oidc-provider/blob/master/lib/helpers/defaults.js
export default {
    debug: true,
    adapter,
    async findAccount(ctx: any, id: string) {
        const account: AccountDocument = await Account.findById(id);

        return {
            accountId: id,
            async claims(use: any, scope: any, claims: any, rejected: any) {
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
        email: ['email'],
        address: ['address'],
        privateKey: ['privateKey'],
        profile: ['assetPools', 'burnProofs'],
        asset_pools: ['read:asset_pools', 'write:asset_pools'],
    },
    jwks,
    clients: [
        {
            application_type: 'web',
            client_id: 'dev.wallet.thx',
            client_secret: 'mellon',
            grant_types: ['authorization_code'],
            response_types: ['code'],
            redirect_uris: ['https://localhost:8080/signin-oidc'],
            post_logout_redirect_uris: ['https://localhost:8080'],
        },
        {
            application_type: 'web',
            client_id: 'dev.opensocial.sparkblue',
            client_secret: 'mellon',
            grant_types: ['client_credentials'],
            redirect_uris: [],
            response_types: [],
        },
    ],
    formats: {
        AccessToken: 'jwt',
        ClientCredentials: 'jwt',
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
    // TODO
    // https://github.com/panva/node-oidc-provider/blob/master/docs/README.md#featuresrpinitiatedlogout
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
    },
};
