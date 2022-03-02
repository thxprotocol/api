import request from 'supertest';
import app from '@/app';
import { getProvider } from '@/util/network';
import { tokenName, tokenSymbol, userWalletPrivateKey2, DEPOSITOR_PK } from '@/util/jest/constants';
import { isAddress, toChecksumAddress } from 'web3-utils';
import { Account } from 'web3-core';
import { createWallet } from '@/util/jest/network';
import { getToken } from '@/util/jest/jwt';
import { afterAllCallback, beforeAllCallback } from '@/util/jest/config';
import AssetPoolService, { ADMIN_ROLE } from '@/services/AssetPoolService';
import { PRIVATE_KEY } from '@/config/secrets';
import { NetworkProvider } from '@/types/enums';

const user = request.agent(app);

describe('Transfer Pool Ownership', () => {
    let adminAccessToken: string, dashboardAccessToken: string, poolAddress: string, userWallet: Account;

    beforeAll(async () => {
        await beforeAllCallback();

        userWallet = createWallet(userWalletPrivateKey2);

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
                    token: {
                        name: tokenName,
                        symbol: tokenSymbol,
                        totalSupply: 0,
                    },
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
            const { methods } = assetPool.solution;
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
