import nock from 'nock';
import {
    userEmail2,
    clientId,
    clientSecret,
    registrationAccessToken,
    requestUris,
    feeData,
    userWalletAddress2,
    account2,
    sub2,
    account,
    sub,
    userEmail,
    userWalletAddress,
} from './constants';
import { getToken, jwksResponse } from './jwt';
import { ISSUER } from '@/config/secrets';

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

    // Account 1 (Dashboard)
    mockAuthPath('get', `/account/${sub}`, 200, account);
    mockAuthPath('patch', `/account/${sub}`, 204, {});
    mockAuthPath('get', `/account/email/${userEmail}`, 200, account);
    mockAuthPath('get', `/account/address/${userWalletAddress}`, 200, account);

    // Account 2 (Web Wallet)
    mockAuthPath('get', `/account/${sub2}`, 200, account2);
    mockAuthPath('patch', `/account/${sub2}`, 204, {});
    mockAuthPath('post', '/account', 200, account2);
    mockAuthPath('get', `/account/address/${userWalletAddress2}`, 200, account2);
    mockAuthPath('get', `/account/email/${userEmail2}`, 404, {});

    // Mock gas price to be lower than configured cap for all tests. Be aware that
    // the tx_queue test will override this mock.
    mockUrl('get', 'https://gasstation-mainnet.matic.network', '/v2', 200, feeData);
    mockUrl('get', 'https://gasstation-mumbai.matic.today', '/v2', 200, feeData);
}

export function mockClear() {
    return nock.cleanAll();
}
