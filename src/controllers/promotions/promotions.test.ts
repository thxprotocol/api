import request, { Response } from 'supertest';
import app from '@/app';
import { isAddress } from 'web3-utils';
import { Contract } from 'web3-eth-contract';
import { IPromotionResponse } from '@/types/interfaces/IPromoCodeResponse';
import { afterAllCallback, beforeAllCallback } from '@/util/jest/config';
import { NetworkProvider } from '@/types/enums';
import { getContract } from '@/config/contracts';
import { dashboardAccessToken } from '@/util/jest/constants';

const http = request.agent(app);

describe('PromoCodes', () => {
    let promoCode: IPromotionResponse, testToken: Contract, poolAddress: string;

    const value = 'XX78WEJ1219WZ';
    const price = 10;
    const title = 'The promocode title shown in wallet';
    const description = 'Longer form for a description of the usage';
    // const expiry = Date.now();

    beforeAll(async () => {
        await beforeAllCallback();

        testToken = getContract(NetworkProvider.Main, 'LimitedSupplyToken');
    });

    afterAll(afterAllCallback);

    it('Create pool', (done) => {
        http.post('/v1/pools')
            .set('Authorization', dashboardAccessToken)
            .send({
                network: NetworkProvider.Main,
                tokens: [testToken.options.address],
            })
            .expect((res: request.Response) => {
                expect(isAddress(res.body.address)).toBe(true);
                poolAddress = res.body.address;
            })
            .expect(201, done);
    });

    describe('Management (Dashboard)', () => {
        it('POST /promotions', (done) => {
            http.post('/v1/promotions')
                .set({ 'Authorization': dashboardAccessToken, 'X-PoolAddress': poolAddress })
                .send({
                    price,
                    value,
                    title,
                    description,
                    // expiry,
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

        it('GET /promotions 200 OK', (done) => {
            http.get('/v1/promotions')
                .set({ 'Authorization': dashboardAccessToken, 'X-PoolAddress': poolAddress })
                .expect(({ body }: Response) => {
                    expect(body.total).toEqual(1);
                    expect(body.results).toHaveLength(1);
                    expect(body.results[0].id).toBeDefined();
                    expect(body.results[0].title).toEqual(title);
                    expect(body.results[0].description).toEqual(description);
                    expect(body.results[0].price).toEqual(price);
                    expect(body.results[0].value).toEqual(value);
                    // expect(Date.parse(body.results[0].expiry)).toEqual(expiry);
                })
                .expect(200, done);
        });

        it('GET /promotions/:id', (done) => {
            http.get('/v1/promotions/' + promoCode.id)
                .set({ 'Authorization': dashboardAccessToken, 'X-PoolAddress': poolAddress })
                .expect(({ body }: Response) => {
                    expect(body.id).toEqual(promoCode.id);
                    expect(body.value).toEqual(value);
                    expect(body.price).toEqual(price);
                    // expect(Date.parse(body.expiry)).toEqual(expiry);
                })
                .expect(200, done);
        });

        it('GET /promotions/:id 400 Bad Input', (done) => {
            http.get('/v1/promotions/' + 'invalid_id')
                .set({ 'Authorization': dashboardAccessToken, 'X-PoolAddress': poolAddress })
                .expect(({ body }: Response) => {
                    expect(body.errors).toHaveLength(1);
                    expect(body.errors[0].param).toEqual('id');
                    expect(body.errors[0].msg).toEqual('Invalid value');
                })
                .expect(400, done);
        });

        it('GET /promotions/:id 404 Not Found', (done) => {
            http.get('/v1/promotions/' + '6208dfa33400429348c5e61b')
                .set({ 'Authorization': dashboardAccessToken, 'X-PoolAddress': poolAddress })
                .expect(({ body }: Response) => {
                    expect(body.error.message).toEqual('Could not find this promo code');
                })
                .expect(404, done);
        });
    });
});
