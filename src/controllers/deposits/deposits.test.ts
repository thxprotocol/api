import app from '@/app';
import request, { Response } from 'supertest';
import { Account } from 'web3-core';
import { isAddress, toWei } from 'web3-utils';
import { Contract } from 'web3-eth-contract';
import { afterAllCallback, beforeAllCallback } from '@/util/jest/config';
import { getToken } from '@/util/jest/jwt';
import { ERC20Type, NetworkProvider, TransactionState } from '@/types/enums';
import { IPromoCodeResponse } from '@/types/interfaces/IPromoCodeResponse';
import { createWallet, signMethod } from '@/util/jest/network';
import { findEvent, parseLogs } from '@/util/events';
import { MaxUint256, tokenName, tokenSymbol, userWalletPrivateKey2 } from '@/util/jest/constants';
import { AmountExceedsAllowanceError, InsufficientBalanceError } from '@/util/errors';
import TransactionService from '@/services/TransactionService';
import { getContractFromName } from '@/config/contracts';
import { getProvider } from '@/util/network';
import { BigNumber } from 'ethers';
import { fromWei } from 'web3-utils';

const http = request.agent(app);

describe('Deposits', () => {
    let dashboardAccessToken: string,
        userAccessToken: string,
        poolAddress: string,
        promoCode: IPromoCodeResponse,
        userWallet: Account,
        tokenAddress: string,
        testToken: Contract,
        adminAccessToken: string;

    const value = 'XX78WEJ1219WZ';
    const price = 10;
    const title = 'The promocode title shown in wallet';
    const description = 'Longer form for a description of the usage';
    // const expiry = Date.now();

    afterAll(afterAllCallback);

    beforeAll(async () => {
        await beforeAllCallback();

        userWallet = createWallet(userWalletPrivateKey2);

        dashboardAccessToken = getToken('openid dashboard promo_codes:read promo_codes:write members:write');
        userAccessToken = getToken(
            'openid user promo_codes:read payments:write payments:read deposits:write deposits:read',
        );
    });

    it('Create token', (done) => {
        http.post('/v1/erc20')
            .set('Authorization', dashboardAccessToken)
            .send({
                network: NetworkProvider.Main,
                name: tokenName,
                symbol: tokenSymbol,
                type: ERC20Type.Unlimited,
                totalSupply: 0,
            })
            .expect(({ body }: request.Response) => {
                expect(isAddress(body.address)).toBe(true);
                tokenAddress = body.address;
                testToken = getContractFromName(NetworkProvider.Main, 'LimitedSupplyToken', tokenAddress);
            })
            .expect(201, done);
    });

    it('Create pool', (done) => {
        http.post('/v1/pools')
            .set('Authorization', dashboardAccessToken)
            .send({
                network: NetworkProvider.Main,
                token: tokenAddress,
            })
            .expect((res: request.Response) => {
                expect(isAddress(res.body.address)).toBe(true);
                poolAddress = res.body.address;
            })
            .expect(201, done);
    });

    it('Add member', (done) => {
        http.post('/v1/members')
            .set({ 'Authorization': dashboardAccessToken, 'X-PoolAddress': poolAddress })
            .send({
                address: userWallet.address,
            })
            .expect(302, done);
    });

    it('Create promo code', (done) => {
        http.post('/v1/promo_codes')
            .set({ 'Authorization': dashboardAccessToken, 'X-PoolAddress': poolAddress })
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
                .set({ 'Authorization': userAccessToken, 'X-PoolAddress': poolAddress })
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
                .set({ 'Authorization': userAccessToken, 'X-PoolAddress': poolAddress })
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
                .set({ 'Authorization': userAccessToken, 'X-PoolAddress': poolAddress })
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
                .set({ 'Authorization': userAccessToken, 'X-PoolAddress': poolAddress })
                .send({ call, nonce, sig, item: promoCode.id })
                .expect(200);
        });

        it('GET /promo_codes/:id', (done) => {
            http.get('/v1/promo_codes/' + promoCode.id)
                .set({ 'Authorization': userAccessToken, 'X-PoolAddress': poolAddress })
                .expect(({ body }: Response) => {
                    expect(body.value).toEqual(value);
                })
                .expect(200, done);
        });
    });

    describe('Create Asset Pool Deposit', () => {
        const { admin } = getProvider(NetworkProvider.Main);
        const totalSupply = fromWei('200000000000000000000', 'ether'); // 200 eth

        it('Create token', (done) => {
            http.post('/v1/erc20')
                .set('Authorization', dashboardAccessToken)
                .send({
                    network: NetworkProvider.Main,
                    name: 'LIMITED SUPPLY TOKEN',
                    symbol: 'LIM',
                    type: ERC20Type.Limited,
                    totalSupply: totalSupply,
                })
                .expect(async ({ body }: request.Response) => {
                    expect(isAddress(body.address)).toBe(true);
                    tokenAddress = body.address;
                    testToken = getContractFromName(NetworkProvider.Main, 'LimitedSupplyToken', tokenAddress);
                    const adminBalance: BigNumber = await testToken.methods.balanceOf(admin.address).call();
                    expect(fromWei(String(adminBalance), 'ether')).toBe(totalSupply);
                })
                .expect(201, done);
        });

        it('Create pool', (done) => {
            http.post('/v1/pools')
                .set('Authorization', dashboardAccessToken)
                .send({
                    network: NetworkProvider.Main,
                    token: tokenAddress,
                })
                .expect(async (res: request.Response) => {
                    expect(isAddress(res.body.address)).toBe(true);
                    poolAddress = res.body.address;
                    const adminBalance: BigNumber = await testToken.methods.balanceOf(admin.address).call();
                    const poolBalance: BigNumber = await testToken.methods.balanceOf(poolAddress).call();
                    expect(String(poolBalance)).toBe('0');
                    expect(fromWei(String(adminBalance), 'ether')).toBe(totalSupply);
                })
                .expect(201, done);
        });

        it('POST /deposits/admin/ 200 OK', (done) => {
            const amount = fromWei('100000000000000000000', 'ether'); // 100 eth
            http.post('/v1/deposits/admin')
                .set({ 'Authorization': dashboardAccessToken, 'X-PoolAddress': poolAddress })
                .send({ amount })
                .expect(async () => {
                    const adminBalance: BigNumber = await testToken.methods.balanceOf(admin.address).call();
                    const poolBalance: BigNumber = await testToken.methods.balanceOf(poolAddress).call();
                    expect(String(poolBalance)).toBe('97500000000000000000'); // 100 eth - protocol fee = 97.5 eth
                    expect(String(adminBalance)).toBe('100000000000000000000'); // 100 eth
                })
                .expect(200, done);
        });
    });
});
