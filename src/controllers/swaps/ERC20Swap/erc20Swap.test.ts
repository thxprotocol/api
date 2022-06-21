import request, { Response } from 'supertest';
import app from '@/app';
import { isAddress } from 'web3-utils';
import { Contract } from 'web3-eth-contract';
import { afterAllCallback, beforeAllCallback } from '@/util/jest/config';
import { ChainId, ERC20Type } from '@/types/enums';
import { getContract, getContractFromName } from '@/config/contracts';
import {
    adminAccessToken,
    dashboardAccessToken,
    MaxUint256,
    userWalletPrivateKey2,
    walletAccessToken,
} from '@/util/jest/constants';
import { createWallet, signMethod } from '@/util/jest/network';
import { Account } from 'web3-core';
import { fromWei } from 'web3-utils';
import { getProvider } from '@/util/network';
import { BigNumber } from 'ethers';
import TransactionService from '@/services/TransactionService';
import { toWei } from 'web3-utils';
import { assertEvent, parseLogs } from '@/util/events';
import { currentVersion } from '@thxnetwork/artifacts';

const http = request.agent(app);

describe('ERC20Swaps', () => {
    let userWallet: Account,
        swaprule: any,
        testToken: Contract,
        testToken2: Contract,
        poolAddress: string,
        poolId: string,
        amountIn: number,
        tokenAddress: string,
        tokenInAddress: string,
        tokenMultiplier: number;

    beforeAll(async () => {
        await beforeAllCallback();

        amountIn = 10;

        tokenMultiplier = 10;
        userWallet = createWallet(userWalletPrivateKey2);
    });

    afterAll(afterAllCallback);

    it('DEPLOY TOKEN A', async () => {
        const { admin } = getProvider(ChainId.Hardhat);
        const totalSupply = fromWei('1000000000000000000000', 'ether'); // 1000 eth
        const tokenFactory = getContract(ChainId.Hardhat, 'TokenFactory', currentVersion);
        const { receipt } = await TransactionService.send(
            tokenFactory.options.address,
            tokenFactory.methods.deployLimitedSupplyToken('TOKEN A', 'TKNA', admin.address, toWei(String(totalSupply))),
            ChainId.Hardhat,
        );
        const event = assertEvent('TokenDeployed', parseLogs(tokenFactory.options.jsonInterface, receipt.logs));
        tokenAddress = event.args.token;
        testToken = getContractFromName(ChainId.Hardhat, 'LimitedSupplyToken', tokenAddress);
    });

    it('DEPLOY TOKEN B (TOKEN IN)', async () => {
        const totalSupply = fromWei('200000000000000000000', 'ether'); // 200 eth
        const tokenFactory = getContract(ChainId.Hardhat, 'TokenFactory', currentVersion);
        const { receipt } = await TransactionService.send(
            tokenFactory.options.address,
            tokenFactory.methods.deployLimitedSupplyToken(
                'TOKEN B',
                'TKNB',
                userWallet.address,
                toWei(String(totalSupply)),
            ),
            ChainId.Hardhat,
        );
        const event = assertEvent('TokenDeployed', parseLogs(tokenFactory.options.jsonInterface, receipt.logs));
        tokenInAddress = event.args.token;
        testToken2 = getContractFromName(ChainId.Hardhat, 'LimitedSupplyToken', tokenInAddress);
    });

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
                poolId = res.body._id;
            })
            .expect(201, done);
    });

    it('POST /deposits/admin/ 200 OK', (done) => {
        const { admin } = getProvider(ChainId.Hardhat);
        const amount = fromWei('1000000000000000000000', 'ether'); // 1000 eth
        http.post(`/v1/pools/${poolId}/topup`)
            .set({ 'Authorization': dashboardAccessToken, 'X-PoolAddress': poolAddress })
            .send({ amount })
            .expect(200, done);
    });

    it('POST /swaprules', (done) => {
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

    it('Add member', (done) => {
        http.post('/v1/members')
            .set({ 'Authorization': adminAccessToken, 'X-PoolAddress': poolAddress })
            .send({
                address: userWallet.address,
            })
            .expect(302, done);
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
            const { call, nonce, sig } = await signMethod(
                poolAddress,
                'swap',
                [amountIn.toString(), tokenInAddress],
                userWallet,
            );
            await http
                .post('/v1/swaps')
                .set({ 'Authorization': walletAccessToken, 'X-PoolAddress': poolAddress })
                .send({ call, nonce, sig, amountIn, tokenAddress, tokenInAddress })
                .expect(200);
        });

        // it('GET /swaps 200 OK', (done) => {
        //     http.get('/v1/swaps')
        //         .set({ 'Authorization': walletAccessToken, 'X-PoolAddress': poolAddress })
        //         .expect(({ body }: Response) => {
        //             expect(body.total).toEqual(1);
        //             expect(body.results).toHaveLength(1);
        //             expect(body.results[0].id).toBeDefined();
        //             expect(body.results[0].amountIn).toEqual(amountIn);
        //             expect(body.results[0].tokenAddress).toEqual(tokenInAddress);
        //             expect(body.results[0].swapRuleId).toBeDefined();
        //         })
        //         .expect(200, done);
        // });

        // it('GET /swaps/:id', (done) => {
        //     http.get('/v1/swaps/' + swaprule.id)
        //         .set({ 'Authorization': walletAccessToken, 'X-PoolAddress': poolAddress })
        //         .expect(({ body }: Response) => {
        //             expect(body.id).toEqual(swaprule.id);
        //             expect(body.amountIn).toEqual(amountIn);
        //             expect(body.tokenAddress).toEqual(tokenInAddress);
        //             expect(body.swapRuleId).toBeDefined();
        //         })
        //         .expect(200, done);
        // });

        // it('GET /swaps/:id 400 Bad Input', (done) => {
        //     http.get('/v1/swaps/' + 'invalid_id')
        //         .set({ 'Authorization': walletAccessToken, 'X-PoolAddress': poolAddress })
        //         .expect(({ body }: Response) => {
        //             expect(body.errors).toHaveLength(1);
        //             expect(body.errors[0].param).toEqual('id');
        //             expect(body.errors[0].msg).toEqual('Invalid value');
        //         })
        //         .expect(400, done);
        // });

        // it('GET /swaps/:id 404 Not Found', (done) => {
        //     http.get('/v1/swaps/' + '6208dfa33400429348c5e61b')
        //         .set({ 'Authorization': walletAccessToken, 'X-PoolAddress': poolAddress })
        //         .expect(({ body }: Response) => {
        //             expect(body.error.message).toEqual('Could not find this Swap');
        //         })
        //         .expect(404, done);
        // });
    });
});
