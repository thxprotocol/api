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

export function mockAuthPath(method: string, path: string, status: number, callback: any = {}) {
    const n = nock(ISSUER).persist() as any;
    return n[method](path).reply(status, callback);
}

export function mockUrl(method: string, baseUrl: string, path: string, status: number, callback: any = {}) {
    const n = nock(baseUrl).persist() as any;
    return n[method](path).reply(status, callback);
}

export function mockStart() {
    mockAuthPath('get', '/jwks', 200, jwksResponse);
    mockAuthPath('post', '/token', 200, async () => {
        return {
            access_token: getToken('openid account:read account:write'),
        };
    });
    mockAuthPath('post', '/reg', 201, {
        client_id: clientId,
        registration_access_token: registrationAccessToken,
    });
    mockAuthPath('get', `/reg/${clientId}?access_token=${registrationAccessToken}`, 200, {
        client_id: clientId,
        client_secret: clientSecret,
        request_uris: requestUris,
    });

    mockAuthPath('get', `/account/${sub}`, 200, account);
    mockAuthPath('patch', `/account/${sub}`, 204, {});
    mockAuthPath('post', '/account', 200, account);
    mockAuthPath('get', `/account/email/${userEmail}`, 200, account);
    mockAuthPath('get', `/account/email/${userEmail2}`, 404, {});
    mockAuthPath('get', `/account/address/${userWalletAddress}`, 200, account);
}

export function mockClear() {
    return nock.cleanAll();
}
