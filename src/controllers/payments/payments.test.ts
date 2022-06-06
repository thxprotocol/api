import app from '@/app';
import request, { Response } from 'supertest';
import { Account } from 'web3-core';
import { isAddress, toWei } from 'web3-utils';
import { Contract } from 'web3-eth-contract';
import { afterAllCallback, beforeAllCallback } from '@/util/jest/config';
import { getToken } from '@/util/jest/jwt';
import { ERC20Type, NetworkProvider } from '@/types/enums';
import { createWallet, signMethod } from '@/util/jest/network';
import { tokenName, tokenSymbol, tokenTotalSupply, userWalletPrivateKey2 } from '@/util/jest/constants';
import { getContract, getContractFromName } from '@/config/contracts';
import { PaymentState } from '@/types/enums/PaymentState';
import TransactionService from '@/services/TransactionService';
import { assertEvent, parseLogs } from '@/util/events';
import { currentVersion } from '@thxnetwork/artifacts';

const http = request.agent(app);

describe('Payments', () => {
    let dashboardAccessToken: string,
        userAccessToken: string,
        adminAccessToken: string,
        tokenAddress: string,
        existingTokenAddress: string,
        poolAddress: string,
        paymentId: string,
        userWallet: Account,
        existingToken: Contract,
        token: Contract;

    const returnUrl = 'https://example.com/checkout/confirm?id=123',
        amount = '1000';

    afterAll(afterAllCallback);

    beforeAll(async () => {
        await beforeAllCallback();

        userWallet = createWallet(userWalletPrivateKey2);

        dashboardAccessToken = getToken('openid dashboard');
        userAccessToken = getToken('openid user ');
        adminAccessToken = getToken('openid admin');
    });

    it('Existing token', async () => {
        const tokenFactory = getContract(NetworkProvider.Main, 'TokenFactory', currentVersion);
        const { receipt } = await TransactionService.send(
            tokenFactory.options.address,
            tokenFactory.methods.deployLimitedSupplyToken(
                tokenName,
                tokenSymbol,
                userWallet.address,
                toWei(String(tokenTotalSupply)),
            ),
            NetworkProvider.Main,
        );
        const event = assertEvent('TokenDeployed', parseLogs(tokenFactory.options.jsonInterface, receipt.logs));
        existingTokenAddress = event.args.token;
        existingToken = getContractFromName(NetworkProvider.Main, 'LimitedSupplyToken', existingTokenAddress);
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
            .expect(({ body }: Response) => {
                expect(isAddress(body.address)).toBe(true);
                tokenAddress = body.address;
                token = getContractFromName(NetworkProvider.Main, 'UnlimitedSupplyToken', tokenAddress);
            })
            .expect(201, done);
    });

    it('Create pool', (done) => {
        http.post('/v1/pools')
            .set('Authorization', dashboardAccessToken)
            .send({
                network: NetworkProvider.Main,
                tokens: [tokenAddress],
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
                returnUrl,
                chainId: 31337,
            })
            .expect(({ body }: Response) => {
                expect(body.redirectUrl).toBeDefined();
                expect(body.chainId).toBe(31337);
                expect(body.state).toBe(PaymentState.Pending);
                expect(body.token).toBe(token.options.address);
                expect(body.receiver).toBe(poolAddress);
                expect(body.amount).toBe(amount);

                paymentId = body._id;
            })
            .expect(201, done);
    });

    it('Redirect to wallet and pay', async () => {
        const { call, nonce, sig } = await signMethod(poolAddress, 'deposit', [amount], userWallet);

        await http
            .post(`/v1/payments/${paymentId}/pay`)
            .set({ 'Authorization': userAccessToken, 'X-PoolAddress': poolAddress })
            .send({
                call,
                nonce,
                sig,
                amount,
            })
            .expect(({ body }: Response) => {
                expect(body.state).toBe(PaymentState.Completed);
            })
            .expect(200);
    });
});
