import request from 'supertest';
import app from '@/app';
import { getProvider } from '@/util/network';
import { userWalletPrivateKey2, DEPOSITOR_PK } from '@/util/jest/constants';
import { isAddress, toChecksumAddress } from 'web3-utils';
import { Account } from 'web3-core';
import { Contract } from 'web3-eth-contract';
import { createWallet } from '@/util/jest/network';
import { getToken } from '@/util/jest/jwt';
import { afterAllCallback, beforeAllCallback } from '@/util/jest/config';
import AssetPoolService, { ADMIN_ROLE } from '@/services/AssetPoolService';
import { PRIVATE_KEY } from '@/config/secrets';
import { NetworkProvider } from '@/types/enums';
import { getContract } from '@/config/contracts';

const user = request.agent(app);

describe('Transfer Pool Ownership', () => {
    let adminAccessToken: string,
        dashboardAccessToken: string,
        poolAddress: string,
        testToken: Contract,
        userWallet: Account;

    beforeAll(async () => {
        await beforeAllCallback();

        userWallet = createWallet(userWalletPrivateKey2);
        testToken = getContract(NetworkProvider.Main, 'LimitedSupplyToken');
        adminAccessToken = getToken('openid admin');
        dashboardAccessToken = getToken('openid dashboard');
    });

    afterAll(afterAllCallback);

    describe('POST /asset_pools', () => {
        it('HTTP 201 (success)', (done) => {
            user.post('/v1/asset_pools')
                .set('Authorization', dashboardAccessToken)
                .send({
                    network: NetworkProvider.Main,
                    token: testToken.options.address,
                })
                .expect((res: request.Response) => {
                    expect(isAddress(res.body.address)).toBe(true);
                    poolAddress = res.body.address;
                })
                .expect(201, done);
        });

        it('HTTP 302 when member is added', (done) => {
            user.post('/v1/members/')
                .send({ address: userWallet.address })
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .expect(302, done);
        });

        it('HTTP 302 when member is promoted', (done) => {
            user.patch(`/v1/members/${userWallet.address}`)
                .send({ isManager: true })
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .expect(302, done);
        });
    });

    describe('Ownership transfer', () => {
        it('Transfers correctly', async () => {
            const assetPool = await AssetPoolService.getByAddress(poolAddress);
            await AssetPoolService.transferOwnership(assetPool, PRIVATE_KEY, DEPOSITOR_PK);

            const { web3 } = getProvider(assetPool.network);
            const { methods } = assetPool.contract;
            const newOwner = web3.eth.accounts.privateKeyToAccount(DEPOSITOR_PK);
            const newOwnerAddress = toChecksumAddress(newOwner.address);
            const formerOwner = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY);
            const formerOwnerAddress = toChecksumAddress(formerOwner.address);

            expect(toChecksumAddress(await methods.owner().call())).toBe(newOwnerAddress);
            expect(await methods.isMember(newOwnerAddress).call()).toBe(true);
            expect(await methods.isManager(newOwnerAddress).call()).toBe(true);
            expect(await methods.hasRole(ADMIN_ROLE, newOwnerAddress).call()).toBe(true);
            expect(await methods.isMember(formerOwnerAddress).call()).toBe(false);
            expect(await methods.isManager(formerOwnerAddress).call()).toBe(false);
            expect(await methods.hasRole(ADMIN_ROLE, formerOwnerAddress).call()).toBe(false);
        });
    });
});
