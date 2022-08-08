import app from '@/app';
import request, { Response } from 'supertest';
import { Account } from 'web3-core';
import { isAddress, toWei } from 'web3-utils';
import { Contract } from 'web3-eth-contract';
import { afterAllCallback, beforeAllCallback } from '@/util/jest/config';
import { ChainId } from '@/types/enums';
import {
    account2,
    adminAccessToken,
    dashboardAccessToken,
    tokenName,
    tokenSymbol,
    tokenTotalSupply,
    userWalletPrivateKey2,
    walletAccessToken,
} from '@/util/jest/constants';
import { getByteCodeForContractName, getContract, getContractFromName } from '@/config/contracts';
import { PaymentState } from '@/types/enums/PaymentState';
import TransactionService from '@/services/TransactionService';
import { currentVersion } from '@thxnetwork/artifacts';
import { getProvider } from '@/util/network';
import { HARDHAT_RPC, PRIVATE_KEY, WALLET_URL } from '@/config/secrets';
import Web3 from 'web3';

const http = request.agent(app);

describe('Payments', () => {
    let poolId: string,
        poolAddress: string,
        paymentId: string,
        admin: Account,
        token: Contract,
        basicAccessToken: string;

    const amount = '1000',
        successUrl = 'https://exmaple.com/success',
        failUrl = 'https://exmaple.com/fail',
        cancelUrl = 'https://exmaple.com/cancel';

    afterAll(afterAllCallback);

    beforeAll(async () => {
        await beforeAllCallback();
        const { defaultAccount } = getProvider(ChainId.Hardhat);
        admin = { address: defaultAccount, privateKey: PRIVATE_KEY } as Account;
    });

    it('Deploy existing token', async () => {
        const { options } = getContract(ChainId.Hardhat, 'LimitedSupplyToken', currentVersion);
        token = await TransactionService.deploy(
            options.jsonInterface,
            getByteCodeForContractName('LimitedSupplyToken'),
            [tokenName, tokenSymbol, admin.address, toWei(String(tokenTotalSupply))],
            ChainId.Hardhat,
        );
        await token.methods.transfer(account2.address, amount).send({ from: admin.address });
    });

    it('Create pool', (done) => {
        http.post('/v1/pools')
            .set('Authorization', dashboardAccessToken)
            .send({
                chainId: ChainId.Hardhat,
                erc20: [token.options.address],
            })
            .expect((res: Response) => {
                expect(isAddress(res.body.address)).toBe(true);
                poolId = res.body._id;
                poolAddress = res.body.address;
            })
            .expect(201, done);
    });

    it('Request a payment', (done) => {
        http.post('/v1/payments')
            .set({ 'Authorization': adminAccessToken, 'X-PoolId': poolId })
            .send({
                amount,
                successUrl,
                failUrl,
                cancelUrl,
                chainId: ChainId.Hardhat,
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
                expect(body.state).toBe(PaymentState.Requested);
                expect(body.tokenAddress).toBe(token.options.address);
                expect(body.token).toHaveLength(32);
                expect(body.receiver).toBe(poolAddress);
                expect(body.amount).toBe(amount);
            })
            .expect(201, done);
    });

    it('Get payment information', (done) => {
        http.get('/v1/payments/' + paymentId)
            .set({ 'X-PoolId': poolId, 'X-Payment-Token': basicAccessToken })
            .expect(({ body }: Response) => {
                expect(body.successUrl).toBe(successUrl);
                expect(body.failUrl).toBe(failUrl);
                expect(body.cancelUrl).toBe(cancelUrl);
                expect(body.chainId).toBe(31337);
                expect(body.state).toBe(PaymentState.Requested);
                expect(body.tokenAddress).toBe(token.options.address);
                expect(body.token).toHaveLength(32);
                expect(body.receiver).toBe(poolAddress);
                expect(body.amount).toBe(amount);
            })
            .expect(200, done);
    });

    it('Approve relayed transfer by pool', async () => {
        const web3 = new Web3(HARDHAT_RPC);
        const wallet = web3.eth.accounts.privateKeyToAccount(userWalletPrivateKey2);
        const { methods } = new web3.eth.Contract(token.options.jsonInterface, token.options.address, {
            from: wallet.address,
        });
        const receipt = await methods.approve(admin.address, amount).send({ from: wallet.address });
        expect(receipt.events['Approval']).toBeDefined();
    });

    it('Relay payment transfer', async () => {
        await http
            .post(`/v1/payments/${paymentId}/pay`)
            .set({ 'Authorization': walletAccessToken, 'X-PoolId': poolId, 'X-Payment-Token': basicAccessToken })
            .expect(({ body }: Response) => {
                console.log(body);
                expect(body.state).toBe(PaymentState.Completed);
            })
            .expect(200);
    });
});
