import nock from 'nock';
import { account, userWalletAddress, userEmail2, userEmail, sub } from './constants';
import { jwksResponse } from './jwt';
import { ISSUER } from '../../../src/util/secrets';

export function mockPath(method: string, path: string, status: number, callback: any = {}) {
    const n = nock(ISSUER).persist() as any;

    return n[method](path).reply(status, callback);
}

export function mockStart() {
    mockPath('get', '/jwks', 200, jwksResponse);
    mockPath('post', '/reg', 201, {});

    mockPath('patch', `/account/${sub}`, 200, {});
    mockPath('get', `/account/email/${userEmail}`, 200, account);
    mockPath('get', `/account/email/${userEmail2}`, 404, {});
    mockPath('get', `/account/address/${userWalletAddress}`, 200, account);
}

export function mockClear() {
    return nock.cleanAll();
}
