import request, { Response } from 'supertest';
import server from '../../server';
import db from '@/util/database';
import { getToken } from '../../../test/e2e/lib/jwt';
import { mockClear, mockStart } from '../../../test/e2e/lib/mock';
import { agenda } from '@/util/agenda';
import { IPromoCodeResponse } from '@/interfaces/IPromoCodeResponse';

const http = request.agent(server);

describe('PromoCodes', () => {
    let dashboardAccessToken: string, promoCode: IPromoCodeResponse;

    const value = 'XX78WEJ1219WZ';
    const price = 10;
    const expiry = Date.now();

    beforeAll(async () => {
        await db.truncate();
        mockStart();
        dashboardAccessToken = getToken('openid dashboard promo_codes:read promo_codes:write members:write');
    });

    // This should move to a more abstract level and be effective for every test
    afterAll(async () => {
        await agenda.stop();
        await agenda.close();
        await db.disconnect();
        server.close();
        mockClear();
    });

    describe('Management (Dashboard)', () => {
        it('POST /promo_codes', (done) => {
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

        it('GET /promo_codes 200 OK', (done) => {
            http.get('/v1/promo_codes')
                .set({ Authorization: dashboardAccessToken })
                .expect(({ body }: Response) => {
                    expect(body.total).toEqual(1);
                    expect(body.results).toHaveLength(1);
                    expect(body.results[0].id).toBeDefined();
                    expect(body.results[0].value).toEqual(value);
                    expect(body.results[0].price).toEqual(price);
                    expect(Date.parse(body.results[0].expiry)).toEqual(expiry);
                })
                .expect(200, done);
        });

        it('GET /promo_codes/:id', (done) => {
            http.get('/v1/promo_codes/' + promoCode.id)
                .set({ Authorization: dashboardAccessToken })
                .expect(({ body }: Response) => {
                    expect(body.id).toEqual(promoCode.id);
                    expect(body.value).toEqual(value);
                    expect(body.price).toEqual(price);
                    expect(Date.parse(body.expiry)).toEqual(expiry);
                })
                .expect(200, done);
        });

        it('GET /promo_codes/:id 400 Bad Input', (done) => {
            http.get('/v1/promo_codes/' + 'invalid_id')
                .set({ Authorization: dashboardAccessToken })
                .expect(({ body }: Response) => {
                    expect(body.errors).toHaveLength(1);
                    expect(body.errors[0].param).toEqual('id');
                    expect(body.errors[0].msg).toEqual('Invalid value');
                })
                .expect(400, done);
        });

        it('GET /promo_codes/:id 404 Not Found', (done) => {
            http.get('/v1/promo_codes/' + '6208dfa33400429348c5e61b')
                .set({ Authorization: dashboardAccessToken })
                .expect(({ body }: Response) => {
                    expect(body.error.message).toEqual('Could not find this promo code');
                })
                .expect(404, done);
        });
    });
});
