import request, { Response } from 'supertest';
import app from '@/app';
import { isAddress } from 'web3-utils';
import { Contract } from 'web3-eth-contract';
import { afterAllCallback, beforeAllCallback } from '@/util/jest/config';
import { ChainId } from '@/types/enums';
import { getContract } from '@/config/contracts';
import { dashboardAccessToken } from '@/util/jest/constants';

const http = request.agent(app);

describe('ERC20SwapRules', () => {
    let swaprule: any, testToken: Contract, poolAddress: string, tokenInAddress: string, tokenMultiplier: number;

    beforeAll(async () => {
        await beforeAllCallback();
        testToken = getContract(ChainId.Hardhat, 'LimitedSupplyToken');

        tokenInAddress = testToken.options.address;
        tokenMultiplier = 10;
    });

    afterAll(afterAllCallback);

    it('Create pool', (done) => {
        http.post('/v1/pools')
            .set('Authorization', dashboardAccessToken)
            .send({
                chainId: ChainId.Hardhat,
                tokens: [testToken.options.address],
            })
            .expect((res: request.Response) => {
                expect(isAddress(res.body.address)).toBe(true);
                poolAddress = res.body.address;
            })
            .expect(201, done);
    });

    describe('Management (Dashboard)', () => {
        it('POST /', (done) => {
            http.post('/v1/swaprules')
                .set({ 'Authorization': dashboardAccessToken, 'X-PoolAddress': poolAddress })
                .send({
                    tokenInAddress,
                    tokenMultiplier,
                })
                .expect(({ body }: Response) => {
                    expect(body._id).toBeDefined();
                    expect(body.tokenInAddress).toEqual(tokenInAddress);
                    expect(body.tokenMultiplier).toEqual(tokenMultiplier);
                    swaprule = body;
                })
                .expect(200, done);
        });

        it('GET /swaprules 200 OK', (done) => {
            http.get('/v1/swaprules')
                .set({ 'Authorization': dashboardAccessToken, 'X-PoolAddress': poolAddress })
                .expect(({ body }: Response) => {
                    expect(body.total).toEqual(1);
                    expect(body.results).toHaveLength(1);
                    expect(body.results[0]._id).toBeDefined();
                    expect(body.results[0].tokenInAddress).toEqual(tokenInAddress);
                    expect(body.results[0].tokenMultiplier).toEqual(tokenMultiplier);
                })
                .expect(200, done);
        });

        it('GET /swaprules/:id', (done) => {
            http.get('/v1/swaprules/' + swaprule._id)
                .set({ 'Authorization': dashboardAccessToken, 'X-PoolAddress': poolAddress })
                .expect(({ body }: Response) => {
                    expect(body._id).toEqual(swaprule._id);
                    expect(body.tokenInAddress).toEqual(tokenInAddress);
                    expect(body.tokenMultiplier).toEqual(tokenMultiplier);
                })
                .expect(200, done);
        });

        it('GET /swaprules/:id 400 Bad Input', (done) => {
            http.get('/v1/swaprules/' + 'invalid_id')
                .set({ 'Authorization': dashboardAccessToken, 'X-PoolAddress': poolAddress })
                .expect(({ body }: Response) => {
                    expect(body.errors).toHaveLength(1);
                    expect(body.errors[0].param).toEqual('id');
                    expect(body.errors[0].msg).toEqual('Invalid value');
                })
                .expect(400, done);
        });

        it('GET /swaprules/:id 404 Not Found', (done) => {
            http.get('/v1/swaprules/' + '6208dfa33400429348c5e61b')
                .set({ 'Authorization': dashboardAccessToken, 'X-PoolAddress': poolAddress })
                .expect(({ body }: Response) => {
                    expect(body.error.message).toEqual('Could not find this Swap Rule');
                })
                .expect(404, done);
        });
    });
});
