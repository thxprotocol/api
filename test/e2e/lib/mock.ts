import nock from 'nock';
import {
    account,
    userWalletAddress,
    userEmail2,
    userEmail,
    sub,
    clientId,
    clientSecret,
    registrationAccessToken,
    requestUris,
} from './constants';
import { getToken, jwksResponse } from './jwt';
import { ISSUER } from '../../../src/util/secrets';

export function mockPath(method: string, path: string, status: number, callback: any = {}) {
    const n = nock(ISSUER).persist() as any;

    return n[method](path).reply(status, callback);
}

export function mockStart() {
    mockPath('get', '/jwks', 200, jwksResponse);
    mockPath('post', '/token', 201, async () => {
        return {
            access_token: getToken('openid account:read account:write'),
        };
    });
    mockPath('post', '/reg', 201, {
        client_id: clientId,
        registration_access_token: registrationAccessToken,
    });
    mockPath('get', `/reg/${clientId}?access_token=${registrationAccessToken}`, 200, {
        client_id: clientId,
        client_secret: clientSecret,
        request_uris: requestUris,
    });

    mockPath('get', `/account/${sub}`, 200, account);
    mockPath('patch', `/account/${sub}`, 200, {});
    mockPath('post', '/account', 200, account);
    mockPath('get', `/account/email/${userEmail}`, 200, account);
    mockPath('get', `/account/email/${userEmail2}`, 404, {});
    mockPath('get', `/account/address/${userWalletAddress}`, 200, account);
}

export function mockClear() {
    return nock.cleanAll();
}
