import request, { Response } from 'supertest';
import app from '@/app';
import { isAddress } from 'web3-utils';
import { Contract } from 'web3-eth-contract';
import { afterAllCallback, beforeAllCallback } from '@/util/jest/config';
import { ChainId } from '@/types/enums';
import { getContract } from '@/config/contracts';
import { dashboardAccessToken, MaxUint256, userWalletPrivateKey2, walletAccessToken } from '@/util/jest/constants';
import { createWallet, signMethod } from '@/util/jest/network';
import { Account } from 'web3-core';

const http = request.agent(app);

describe('ERC20Swaps', () => {
    let userWallet: Account,
        swaprule: any,
        testToken: Contract,
        testToken2: Contract,
        poolAddress: string,
        amountIn: number,
        tokenAddress: string,
        tokenMultiplier: number;

    beforeAll(async () => {
        await beforeAllCallback();
        testToken = getContract(ChainId.Hardhat, 'LimitedSupplyToken');

        testToken2 = getContract(ChainId.Hardhat, 'UnlimitedSupplyToken');

        amountIn = 10;
        tokenAddress = testToken2.options.address;
        tokenMultiplier = 10;
        userWallet = createWallet(userWalletPrivateKey2);
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

    it('POST /', (done) => {
        http.post('/v1/swaprules')
            .set({ 'Authorization': dashboardAccessToken, 'X-PoolAddress': poolAddress })
            .send({
                tokenAddress,
                tokenMultiplier,
            })
            .expect(({ body }: Response) => {
                expect(body.id).toBeDefined();
                expect(body.tokenInAddress).toEqual(tokenAddress);
                expect(body.tokenMultiplier).toEqual(tokenMultiplier);
                swaprule = body;
            })
            .expect(201, done);
    });

    it('Approve for infinite amount', async () => {
        const tx = await testToken2.methods.approve(poolAddress, MaxUint256).send({ from: userWallet.address });
        const event: any = Object.values(tx.events).filter((e: any) => e.event === 'Approval')[0];
        expect(event.returnValues.owner).toEqual(userWallet.address);
        expect(event.returnValues.spender).toEqual(poolAddress);
        expect(event.returnValues.value).toEqual(String(MaxUint256));
    });

    describe('Management (Dashboard)', () => {
        it('POST /swaps 200 OK', async () => {
            const { call, nonce, sig } = await signMethod(poolAddress, 'swap', [amountIn, tokenAddress], userWallet);
            await http
                .post('/v1/deposits')
                .set({ 'Authorization': walletAccessToken, 'X-PoolAddress': poolAddress })
                .send({ call, nonce, sig })
                .expect(200);
        });

        it('GET /swaprules 200 OK', (done) => {
            http.get('/v1/swaps')
                .set({ 'Authorization': dashboardAccessToken, 'X-PoolAddress': poolAddress })
                .expect(({ body }: Response) => {
                    expect(body.total).toEqual(1);
                    expect(body.results).toHaveLength(1);
                    expect(body.results[0].id).toBeDefined();
                    expect(body.results[0].amountIn).toEqual(amountIn);
                    expect(body.results[0].tokenAddress).toEqual(tokenAddress);
                    expect(body.results[0].swapRuleId).toBeDefined();
                })
                .expect(200, done);
        });

        it('GET /swaps/:id', (done) => {
            http.get('/v1/swaps/' + swaprule.id)
                .set({ 'Authorization': dashboardAccessToken, 'X-PoolAddress': poolAddress })
                .expect(({ body }: Response) => {
                    expect(body.id).toEqual(swaprule.id);
                    expect(body.amountIn).toEqual(amountIn);
                    expect(body.tokenAddress).toEqual(tokenAddress);
                    expect(body.swapRuleId).toBeDefined();
                })
                .expect(200, done);
        });

        it('GET /swaps/:id 400 Bad Input', (done) => {
            http.get('/v1/swaps/' + 'invalid_id')
                .set({ 'Authorization': dashboardAccessToken, 'X-PoolAddress': poolAddress })
                .expect(({ body }: Response) => {
                    expect(body.errors).toHaveLength(1);
                    expect(body.errors[0].param).toEqual('id');
                    expect(body.errors[0].msg).toEqual('Invalid value');
                })
                .expect(400, done);
        });

        it('GET /swaps/:id 404 Not Found', (done) => {
            http.get('/v1/swaps/' + '6208dfa33400429348c5e61b')
                .set({ 'Authorization': dashboardAccessToken, 'X-PoolAddress': poolAddress })
                .expect(({ body }: Response) => {
                    expect(body.error.message).toEqual('Could not find this Swap');
                })
                .expect(404, done);
        });
    });
});
