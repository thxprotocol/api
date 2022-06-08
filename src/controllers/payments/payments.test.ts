import app from '@/app';
import request, { Response } from 'supertest';
import { Account } from 'web3-core';
import { isAddress, toWei } from 'web3-utils';
import { Contract } from 'web3-eth-contract';
import { afterAllCallback, beforeAllCallback } from '@/util/jest/config';
import { NetworkProvider } from '@/types/enums';
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

const http = request.agent(app);

describe('Payments', () => {
    let poolAddress: string, paymentId: string, admin: Account, token: Contract;

    const returnUrl = 'https://example.com/checkout/confirm?id=123',
        amount = '1000';

    afterAll(afterAllCallback);

    beforeAll(async () => {
        await beforeAllCallback();
        const provider = getProvider(NetworkProvider.Main);
        admin = provider.admin;
        // userWallet = createWallet(userWalletPrivateKey2);
    });

    it('Deploy existing token', async () => {
        const tokenFactory = getContract(NetworkProvider.Main, 'TokenFactory', currentVersion);
        const { receipt } = await TransactionService.send(
            tokenFactory.options.address,
            tokenFactory.methods.deployLimitedSupplyToken(
                tokenName,
                tokenSymbol,
                admin.address,
                toWei(String(tokenTotalSupply)),
            ),
            NetworkProvider.Main,
        );
        const event = assertEvent('TokenDeployed', parseLogs(tokenFactory.options.jsonInterface, receipt.logs));
        token = getContractFromName(NetworkProvider.Main, 'LimitedSupplyToken', event.args.token);
    });

    it('Create pool', (done) => {
        http.post('/v1/pools')
            .set('Authorization', dashboardAccessToken)
            .send({
                network: NetworkProvider.Main,
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

    it('Approve relayed transfer by pool', async () => {
        const receipt = await token.methods.approve(poolAddress, amount).send({ from: admin.address });
        expect(receipt.events['Approval']).toBeDefined();
    });

    it('Relay payment transfer', async () => {
        // Call topup as admin (TODO remove modifier later)
        const { call, nonce, sig } = await signMethod(poolAddress, 'topup', [amount], admin);

        await http
            .post(`/v1/payments/${paymentId}/pay`)
            .set({ 'Authorization': walletAccessToken, 'X-PoolAddress': poolAddress })
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
