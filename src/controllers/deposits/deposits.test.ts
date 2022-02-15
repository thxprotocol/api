import request, { Response } from 'supertest';
import { Account } from 'web3-core';
import { isAddress, toWei } from 'web3-utils';
import { Contract } from 'web3-eth-contract';
import server from '../../server';
import db from '../../util/database';
import { getToken } from '../../../test/e2e/lib/jwt';
import { mockClear, mockStart } from '../../../test/e2e/lib/mock';
import { agenda, eventNameRequireDeposits } from '../../util/agenda';
import {
    callFunction,
    getBalance,
    NetworkProvider,
    sendTransaction,
    solutionContract,
    tokenContract,
} from '../../util/network';
import { IPromoCodeResponse } from '../../interfaces/IPromoCodeResponse';
import { createWallet, deployExampleToken } from '../../../test/e2e/lib/network';
import { findEvent, parseLogs } from '../../util/events';
import { Artifacts } from '../../util/artifacts';
import { userWalletPrivateKey2 } from '../../../test/e2e/lib/constants';
import { AmountExceedsAllowanceError, InsufficientBalanceError } from '../../util/errors';

const http = request.agent(server);

describe('Deposits', () => {
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
        userWallet = createWallet(userWalletPrivateKey2);
        testToken = await deployExampleToken();
        dashboardAccessToken = getToken('openid dashboard promo_codes:read promo_codes:write members:write');
        userAccessToken = getToken('openid user promo_codes:read payments:write payments:read');
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

    describe('Create Deposit', () => {
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

        it('POST /deposits 400 Bad Request', (done) => {
            http.post('/v1/deposits')
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

        it('POST /deposits 400 Bad Request', (done) => {
            http.post('/v1/deposits')
                .set({ Authorization: userAccessToken, AssetPool: poolAddress })
                .send({ item: promoCode.id })
                .expect(({ body }: Response) => {
                    expect(body.error.message).toEqual(new AmountExceedsAllowanceError().message);
                })
                .expect(400, done);
        });

        it('Approve Deposit', async () => {
            const tx = await testToken.methods
                .approve(poolAddress, toWei(String(price)))
                .send({ from: userWallet.address });
            const event: any = Object.values(tx.events).filter((e: any) => e.event === 'Approval')[0];

            expect(event.returnValues.owner).toEqual(userWallet.address);
            expect(event.returnValues.spender).toEqual(poolAddress);
            expect(event.returnValues.value).toEqual(toWei(String(price)));
        });

        it('should disable job processor', async () => {
            await agenda.disable({ name: eventNameRequireDeposits });
        });

        it('POST /deposits 200 OK', async () => {
            await http
                .post('/v1/deposits')
                .set({ Authorization: userAccessToken, AssetPool: poolAddress })
                .send({ item: promoCode.id })
                .expect(({ body }: Response) => {
                    console.log(body);
                })
                .expect(200);
        });

        it('Create Deposit', async () => {
            const solution = solutionContract(NetworkProvider.Main, poolAddress);
            const amount = toWei(String(price));
            const tokenBalance = await testToken.methods
                .balanceOf(userWallet.address)
                .call({ from: userWallet.address });
            const balance = await getBalance(NetworkProvider.Main, userWallet.address);
            console.dir(
                { balance, solutionAddress: solution.options.address, poolAddress, amount, tokenBalance },
                { colors: true },
            );
            const tx = await solution.methods.deposit(amount).send({ from: userWallet.address });
            console.log(tx);
            console.log(tx.events);
            const event: any = Object.values(tx.events).filter((e: any) => e.event === 'Transfer')[0];
            expect(event).toBeDefined();
        });

        it('should enable job processor', async () => {
            await agenda.enable({ name: eventNameRequireDeposits });
        });

        it('should cast a success event', (done) => {
            const callback = async () => {
                agenda.off(`success:${eventNameRequireDeposits}`, callback);
                done();
            };
            agenda.on(`success:${eventNameRequireDeposits}`, callback);
        });

        it('GET /promo_codes/:id', (done) => {
            http.get('/v1/promo_codes/' + promoCode.id)
                .set({ Authorization: userAccessToken })
                .expect(({ body }: Response) => {
                    expect(body.value).toEqual(value);
                })
                .expect(200, done);
        });
    });
});