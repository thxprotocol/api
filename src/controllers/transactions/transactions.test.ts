import request from 'supertest';
import app from '@/app';
import { ERC20Type, NetworkProvider } from '@/types/enums';
import { dashboardAccessToken } from '@/util/jest/constants';
import { Contract } from 'web3-eth-contract';
import { isAddress, fromWei } from 'web3-utils';
import { afterAllCallback, beforeAllCallback } from '@/util/jest/config';
import { getContractFromName } from '@/config/contracts';
import { getProvider } from '@/util/network';
import { BigNumber } from 'ethers';

const http = request.agent(app);
const user = request.agent(app);

describe('Default Pool', () => {
    let poolAddress: string, tokenAddress: string, testToken: Contract;

    beforeAll(async () => {
        await beforeAllCallback();
    });

    afterAll(afterAllCallback);

    // PERFORM 2 DEPOSITS TO GENERATE TRANSACTIONS
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
                .expect(200, done);
        });

        it('POST /deposits/admin/ 200 OK', (done) => {
            const amount = fromWei('100000000000000000000', 'ether'); // 100 eth
            http.post('/v1/deposits/admin')
                .set({ 'Authorization': dashboardAccessToken, 'X-PoolAddress': poolAddress })
                .send({ amount })
                .expect(200, done);
        });
    });

    describe('GET /transactions', () => {
        it('HTTP 200 and returns 2 items', (done) => {
            user.get(`/v1/transactions?page=1&limit=2`)
                .set('Authorization', dashboardAccessToken)
                .set({ 'X-PoolAddress': poolAddress })
                .expect(async (res: request.Response) => {
                    const result = res.body.results;
                    expect(result.length).toBe(2);
                })
                .expect(200, done);
        });
    });
});
