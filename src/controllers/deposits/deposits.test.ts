import app from '@/app';
import request, { Response } from 'supertest';
import { Account } from 'web3-core';
import { isAddress, toWei } from 'web3-utils';
import { Contract } from 'web3-eth-contract';
import { afterAllCallback, beforeAllCallback } from '@/util/jest/config';
import { getToken } from '@/util/jest/jwt';
import { NetworkProvider, TransactionState } from '@/types/enums';
import { IPromoCodeResponse } from '@/types/interfaces/IPromoCodeResponse';
import { createWallet, signMethod } from '@/util/jest/network';
import { findEvent, parseLogs } from '@/util/events';
import { MaxUint256, userWalletPrivateKey2 } from '@/util/jest/constants';
import { AmountExceedsAllowanceError, InsufficientBalanceError } from '@/util/errors';
import TransactionService from '@/services/TransactionService';
import { getContract } from '@/config/contracts';

const http = request.agent(app);

describe('Deposits', () => {
    let dashboardAccessToken: string,
        userAccessToken: string,
        poolAddress: string,
        promoCode: IPromoCodeResponse,
        userWallet: Account,
        testToken: Contract;

    const value = 'XX78WEJ1219WZ';
    const price = 10;
    const title = 'The promocode title shown in wallet';
    const description = 'Longer form for a description of the usage';
    // const expiry = Date.now();

    afterAll(afterAllCallback);

    beforeAll(async () => {
        await beforeAllCallback();

        userWallet = createWallet(userWalletPrivateKey2);

        testToken = getContract(NetworkProvider.Main, 'LimitedSupplyToken');
        dashboardAccessToken = getToken('openid dashboard promo_codes:read promo_codes:write members:write');
        userAccessToken = getToken('openid user promo_codes:read payments:write payments:read');
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
            .set({ Authorization: dashboardAccessToken, AssetPool: poolAddress })
            .send({
                price,
                value,
                title,
                description,
            })
            .expect(({ body }: Response) => {
                expect(body.id).toBeDefined();
                expect(body.price).toEqual(price);
                expect(body.value).toEqual(value);
                expect(body.title).toEqual(title);
                expect(body.description).toEqual(description);
                // expect(Date.parse(body.expiry)).toEqual(expiry);
                promoCode = body;
            })
            .expect(201, done);
    });

    describe('Create Deposit', () => {
        it('GET /promo_codes/:id', (done) => {
            http.get('/v1/promo_codes/' + promoCode.id)
                .set({ Authorization: userAccessToken, AssetPool: poolAddress })
                .expect(({ body }: Response) => {
                    expect(body.id).toEqual(promoCode.id);
                    expect(body.value).toEqual('');
                    expect(body.price).toEqual(price);
                    expect(body.title).toEqual(title);
                    expect(body.description).toEqual(description);
                    // expect(Date.parse(body.expiry)).toEqual(expiry);
                })
                .expect(200, done);
        });

        it('POST /deposits 400 Bad Request', async () => {
            const { call, nonce, sig } = await signMethod(
                poolAddress,
                'deposit',
                [toWei(String(promoCode.price))],
                userWallet,
            );
            await http
                .post('/v1/deposits')
                .set({ Authorization: userAccessToken, AssetPool: poolAddress })
                .send({ call, nonce, sig, item: promoCode.id })
                .expect(({ body }: Response) => {
                    expect(body.error.message).toEqual(new InsufficientBalanceError().message);
                })
                .expect(400);
        });

        it('Increase user balance', async () => {
            const { tx, receipt } = await TransactionService.send(
                testToken.options.address,
                testToken.methods.transfer(userWallet.address, toWei(String(price))),
                NetworkProvider.Main,
            );
            const event = findEvent('Transfer', parseLogs(testToken.options.jsonInterface, receipt.logs));

            expect(tx.state).toBe(TransactionState.Mined);
            expect(event).toBeDefined();
        });

        it('POST /deposits 400 Bad Request', async () => {
            const { call, nonce, sig } = await signMethod(
                poolAddress,
                'deposit',
                [toWei(String(promoCode.price))],
                userWallet,
            );
            await http
                .post('/v1/deposits')
                .set({ Authorization: userAccessToken, AssetPool: poolAddress })
                .send({ call, nonce, sig, item: promoCode.id })
                .expect(({ body }: Response) => {
                    expect(body.error.message).toEqual(new AmountExceedsAllowanceError().message);
                })
                .expect(400);
        });

        it('Approve for infinite amount', async () => {
            const tx = await testToken.methods.approve(poolAddress, MaxUint256).send({ from: userWallet.address });
            const event: any = Object.values(tx.events).filter((e: any) => e.event === 'Approval')[0];
            expect(event.returnValues.owner).toEqual(userWallet.address);
            expect(event.returnValues.spender).toEqual(poolAddress);
            expect(event.returnValues.value).toEqual(String(MaxUint256));
        });

        it('POST /deposits 200 OK', async () => {
            const { call, nonce, sig } = await signMethod(
                poolAddress,
                'deposit',
                [toWei(String(promoCode.price))],
                userWallet,
            );
            await http
                .post('/v1/deposits')
                .set({ Authorization: userAccessToken, AssetPool: poolAddress })
                .send({ call, nonce, sig, item: promoCode.id })
                .expect(200);
        });

        it('GET /promo_codes/:id', (done) => {
            http.get('/v1/promo_codes/' + promoCode.id)
                .set({ Authorization: userAccessToken, AssetPool: poolAddress })
                .expect(({ body }: Response) => {
                    expect(body.value).toEqual(value);
                })
                .expect(200, done);
        });
    });
});
