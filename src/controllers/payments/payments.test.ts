import request, { Response } from 'supertest';
import { isAddress } from 'web3-utils';
import server from '../../../src/server';
import db from '../../../src/util/database';
import { getToken } from '../../../test/e2e/lib/jwt';
import { mockClear, mockStart } from '../../../test/e2e/lib/mock';
import { agenda } from '../../util/agenda';
import { NetworkProvider, getProvider, sendTransaction } from '../../util/network';
import { IPromoCodeResponse } from '../../interfaces/IPromoCodeResponse';
import { Account } from 'web3-core';
import { Contract } from 'web3-eth-contract';
import { createWallet, deployExampleToken } from '../../../test/e2e/lib/network';
import { toWei } from 'web3-utils';
import { findEvent, parseLogs } from '../../util/events';
import { Artifacts } from '../../util/artifacts';
import { userWalletPrivateKey2 } from '../../../test/e2e/lib/constants';
import { AmountExceedsAllowanceError, InsufficientBalanceError } from '../../util/errors';

const http = request.agent(server);

describe('Payments', () => {
    let dashboardAccessToken: string,
        userAccessToken: string,
        poolAddress: string,
        promoCode: IPromoCodeResponse,
        userWallet: Account,
        testToken: Contract;

    const value = 'XX78WEJ1219WZ';
    const price = 10;
    const expiry = Date.now();

    beforeAll(async () => {
        await db.truncate();
        mockStart();
        testToken = await deployExampleToken();
        dashboardAccessToken = getToken('openid dashboard promo_codes:read promo_codes:write members:write');
        userAccessToken = getToken('openid user promo_codes:read');
        userWallet = createWallet(userWalletPrivateKey2);
    });

    // This should move to a more abstract level and be effective for every test
    afterAll(async () => {
        await agenda.stop();
        await agenda.close();
        await db.disconnect();
        server.close();
        mockClear();
    });

    it('Create pool', (done) => {
        http.post('/v1/asset_pools')
            .set('Authorization', dashboardAccessToken)
            .send({
                network: NetworkProvider.Main,
                token: {
                    address: testToken.options.address,
                },
            })
            .expect((res: request.Response) => {
                expect(isAddress(res.body.address)).toBe(true);
                poolAddress = res.body.address;
            })
            .expect(201, done);
    });

    it('Add member', (done) => {
        http.post('/v1/members')
            .set({ Authorization: dashboardAccessToken, AssetPool: poolAddress })
            .send({
                address: userWallet.address,
            })
            .expect(302, done);
    });

    it('Create promo code', (done) => {
        http.post('/v1/promo_codes')
            .set({ Authorization: dashboardAccessToken })
            .send({
                price,
                value,
                expiry,
            })
            .expect(({ body }: Response) => {
                expect(body.id).toBeDefined();
                expect(body.price).toEqual(price);
                expect(body.value).toEqual(value);
                expect(Date.parse(body.expiry)).toEqual(expiry);
                promoCode = body;
            })
            .expect(201, done);
    });

    describe('Create payment', () => {
        it('GET /promo_codes/:id', (done) => {
            http.get('/v1/promo_codes/' + promoCode.id)
                .set({ Authorization: userAccessToken })
                .expect(({ body }: Response) => {
                    expect(body.id).toEqual(promoCode.id);
                    expect(body.value).toBeUndefined();
                    expect(body.price).toEqual(price);
                    expect(Date.parse(body.expiry)).toEqual(expiry);
                })
                .expect(200, done);
        });

        it('POST /payments 400 Bad Request', (done) => {
            http.post('/v1/payments')
                .set({ Authorization: userAccessToken, AssetPool: poolAddress })
                .send({ item: promoCode.id })
                .expect(({ body }: Response) => {
                    expect(body.error.message).toEqual(new InsufficientBalanceError().message);
                })
                .expect(400, done);
        });

        it('Increase user balance', async () => {
            const tx = await sendTransaction(
                testToken.options.address,
                testToken.methods.transfer(userWallet.address, toWei(String(price))),
                NetworkProvider.Main,
            );
            const event = findEvent('Transfer', parseLogs(Artifacts.ERC20.abi, tx.logs));
            expect(event).toBeDefined();
        });

        it('POST /payments 400 Bad Request', (done) => {
            http.post('/v1/payments')
                .set({ Authorization: userAccessToken, AssetPool: poolAddress })
                .send({ item: promoCode.id })
                .expect(({ body }: Response) => {
                    expect(body.error.message).toEqual(new AmountExceedsAllowanceError().message);
                })
                .expect(400, done);
        });

        it('Approve admin for token transfer', async () => {
            const { admin } = getProvider(NetworkProvider.Main);
            const tx = await testToken.methods
                .approve(admin.address, toWei(String(price)))
                .send({ from: userWallet.address });
            const event = Object.values(tx.events).filter((e: any) => e.event === 'Approval')[0];
            expect(event).toBeDefined();
        });

        it('POST /payments 200 OK', (done) => {
            http.post('/v1/payments')
                .set({ Authorization: userAccessToken, AssetPool: poolAddress })
                .expect(({ body }: Response) => {
                    expect(body.value).toEqual(value);
                })
                .expect(200, done);
        });
    });
});
