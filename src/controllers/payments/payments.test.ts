import app from '@/app';
import request, { Response } from 'supertest';
import { Account } from 'web3-core';
import { isAddress, toWei } from 'web3-utils';
import { Contract } from 'web3-eth-contract';
import { afterAllCallback, beforeAllCallback } from '@/util/jest/config';
import { ChainId } from '@/types/enums';
import { createWallet, signMethod } from '@/util/jest/network';
import {
    adminAccessToken,
    dashboardAccessToken,
    tokenName,
    tokenSymbol,
    tokenTotalSupply,
    userWalletPrivateKey2,
    walletAccessToken,
} from '@/util/jest/constants';
import { getContract, getContractFromName } from '@/config/contracts';
import { PaymentState } from '@/types/enums/PaymentState';
import TransactionService from '@/services/TransactionService';
import { assertEvent, parseLogs } from '@/util/events';
import { currentVersion } from '@thxnetwork/artifacts';
import { getProvider } from '@/util/network';
import { WALLET_URL } from '@/config/secrets';

const http = request.agent(app);

describe('Payments', () => {
    let poolAddress: string,
        paymentId: string,
        admin: Account,
        token: Contract,
        basicAccessToken: string,
        poolId: string;
    const returnUrl = 'https://example.com/checkout/confirm?id=123',
        amount = '1000',
        successUrl = 'https://exmaple.com/success',
        failUrl = 'https://exmaple.com/fail',
        cancelUrl = 'https://exmaple.com/cancel';

    afterAll(afterAllCallback);

    beforeAll(async () => {
        await beforeAllCallback();
        const provider = getProvider(ChainId.Hardhat);
        admin = provider.admin;
        // userWallet = createWallet(userWalletPrivateKey2);
    });

    it('Deploy existing token', async () => {
        const tokenFactory = getContract(ChainId.Hardhat, 'TokenFactory', currentVersion);
        const { receipt } = await TransactionService.send(
            tokenFactory.options.address,
            tokenFactory.methods.deployLimitedSupplyToken(
                tokenName,
                tokenSymbol,
                admin.address,
                toWei(String(tokenTotalSupply)),
            ),
            ChainId.Hardhat,
        );
        const event = assertEvent('TokenDeployed', parseLogs(tokenFactory.options.jsonInterface, receipt.logs));
        token = getContractFromName(ChainId.Hardhat, 'LimitedSupplyToken', event.args.token);
    });

    it('Create pool', (done) => {
        http.post('/v1/pools')
            .set('Authorization', dashboardAccessToken)
            .send({
                chainId: ChainId.Hardhat,
                tokens: [token.options.address],
                variant: 'defaultPool',
            })
            .expect((res: Response) => {
                expect(isAddress(res.body.address)).toBe(true);
                poolAddress = res.body.address;
            })
            .expect(201, done);
    });

    it('Request a payment', (done) => {
        http.post('/v1/payments')
            .set({ 'Authorization': adminAccessToken, 'X-PoolAddress': poolAddress })
            .send({
                amount,
                successUrl,
                failUrl,
                cancelUrl,
                chainId: 31337,
            })
            .expect(({ body }: Response) => {
                paymentId = body._id;
                basicAccessToken = body.token;

                expect(body.paymentUrl).toBe(
                    `${WALLET_URL}/payment/${String(paymentId)}?accessToken=${basicAccessToken}`,
                );
                expect(body.successUrl).toBe(successUrl);
                expect(body.failUrl).toBe(failUrl);
                expect(body.cancelUrl).toBe(cancelUrl);
                expect(body.chainId).toBe(31337);
                expect(body.state).toBe(PaymentState.Pending);
                expect(body.tokenAddress).toBe(token.options.address);
                expect(body.token).toHaveLength(32);
                expect(body.receiver).toBe(poolAddress);
                expect(body.amount).toBe(amount);
            })
            .expect(201, done);
    });

    it('Get payment information', (done) => {
        http.get('/v1/payments/' + paymentId)
            .set({ 'X-PoolAddress': poolAddress, 'X-Payment-Token': basicAccessToken })
            .expect(({ body }: Response) => {
                expect(body.successUrl).toBe(successUrl);
                expect(body.failUrl).toBe(failUrl);
                expect(body.cancelUrl).toBe(cancelUrl);
                expect(body.chainId).toBe(31337);
                expect(body.state).toBe(PaymentState.Pending);
                expect(body.tokenAddress).toBe(token.options.address);
                expect(body.token).toHaveLength(32);
                expect(body.receiver).toBe(poolAddress);
                expect(body.amount).toBe(amount);
            })
            .expect(200, done);
    });

    it('Approve relayed transfer by pool', async () => {
        const receipt = await token.methods.approve(poolAddress, amount).send({ from: admin.address });
        expect(receipt.events['Approval']).toBeDefined();
    });

    it('Relay payment transfer', async () => {
        const { call, nonce, sig } = await signMethod(poolAddress, 'topup', [amount], admin);

        await http
            .post(`/v1/payments/${paymentId}/pay`)
            .set({ 'X-PoolAddress': poolAddress, 'X-Payment-Token': basicAccessToken })
            .send({
                call,
                nonce,
                sig,
            })
            .expect(({ body }: Response) => {
                expect(body.state).toBe(PaymentState.Completed);
            })
            .expect(200);
    });
});
